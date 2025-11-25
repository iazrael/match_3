import React, { useState, useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Star, Bomb, Lightbulb, Shuffle } from 'lucide-react';
import { AnimalType, GameState, Grid, TileData, Coordinate } from './types';
import { createBoard, findMatches, cloneGrid, BOARD_SIZE, getRandomAnimal, findPossibleMove } from './utils/gameLogic';
import Tile from './components/Tile';
import { audioService } from './services/audioService';

type ToolType = 'BOMB' | 'HINT' | 'SHUFFLE' | null;

const App: React.FC = () => {
  const [grid, setGrid] = useState<Grid>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(20);
  const [selectedPos, setSelectedPos] = useState<Coordinate | null>(null);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  
  // Tools state
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [tools, setTools] = useState({
    bomb: 3,
    hint: 3,
    shuffle: 3
  });
  const [hintTiles, setHintTiles] = useState<Coordinate[]>([]);
  
  // Touch handling refs
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  
  // Initialize game
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    setGrid(createBoard());
    setScore(0);
    setMoves(20);
    setLevel(1);
    setGameState(GameState.IDLE);
    setCombo(0);
    setTools({ bomb: 3, hint: 3, shuffle: 3 });
    setHintTiles([]);
    setActiveTool(null);
    audioService.playLevelUp();
  };

  const handleTileClick = async (x: number, y: number) => {
    if (gameState !== GameState.IDLE || moves <= 0) return;

    // Handle Bomb Logic
    if (activeTool === 'BOMB') {
      if (tools.bomb > 0) {
        await useBomb(x, y);
      }
      return;
    }

    if (!selectedPos) {
      setSelectedPos({ x, y });
      setHintTiles([]); // Clear hints on interaction
      return;
    }

    // Unselect if same tile
    if (selectedPos.x === x && selectedPos.y === y) {
      setSelectedPos(null);
      return;
    }

    // Check adjacency
    const isAdjacent = Math.abs(selectedPos.x - x) + Math.abs(selectedPos.y - y) === 1;

    if (isAdjacent) {
      handleSwap(selectedPos, { x, y });
      setSelectedPos(null);
      setHintTiles([]); // Clear hints
    } else {
      // Just select the new one
      setSelectedPos({ x, y });
    }
  };

  const useBomb = async (cx: number, cy: number) => {
    setGameState(GameState.ANIMATING);
    setActiveTool(null);
    setTools(prev => ({ ...prev, bomb: prev.bomb - 1 }));
    audioService.playMatch(5); // Bomb sound (simulate high combo sound for impact)

    // Identify 3x3 area
    const matchedIds = new Set<string>();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = cy + dy;
        const nx = cx + dx;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
          matchedIds.add(grid[ny][nx].id);
        }
      }
    }

    await processMatches(grid, matchedIds, true, 1);
  };

  const useShuffle = () => {
    if (gameState !== GameState.IDLE || tools.shuffle <= 0) return;
    
    setTools(prev => ({ ...prev, shuffle: prev.shuffle - 1 }));
    audioService.playSwap();
    
    // Create flat list of types and shuffle them
    const types: AnimalType[] = [];
    grid.forEach(row => row.forEach(tile => types.push(tile.type)));
    
    // Fisher-Yates shuffle
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    const newGrid = cloneGrid(grid);
    let idx = 0;
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        newGrid[y][x].type = types[idx++];
        newGrid[y][x].isMatched = false;
        newGrid[y][x].isNew = false;
      }
    }
    
    setGrid(newGrid);
    
    // Check if shuffle created matches immediately
    const matches = findMatches(newGrid);
    if (matches.size > 0) {
      setTimeout(() => processMatches(newGrid, matches, false, 1), 500);
    }
  };

  const useHint = () => {
    if (gameState !== GameState.IDLE || tools.hint <= 0) return;
    
    const move = findPossibleMove(grid);
    if (move) {
      setTools(prev => ({ ...prev, hint: prev.hint - 1 }));
      setHintTiles([move[0], move[1]]);
      audioService.playSwap(); // Subtle sound
      
      // Auto clear hint after 3 seconds
      setTimeout(() => setHintTiles([]), 3000);
    } else {
      audioService.playInvalid();
    }
  };

  const handleSwap = async (pos1: Coordinate, pos2: Coordinate) => {
    setGameState(GameState.SWAPPING);
    audioService.playSwap();

    const newGrid = cloneGrid(grid);
    
    // Swap types
    const tempType = newGrid[pos1.y][pos1.x].type;
    
    newGrid[pos1.y][pos1.x].type = newGrid[pos2.y][pos2.x].type;
    newGrid[pos2.y][pos2.x].type = tempType;

    // Visual swap
    setGrid(newGrid);

    // Wait for swap animation
    await new Promise(r => setTimeout(r, 300));

    const matches = findMatches(newGrid);

    if (matches.size > 0) {
      // Valid move
      setMoves(m => m - 1);
      setCombo(1); // Reset/Start combo state
      await processMatches(newGrid, matches, false, 1); // Start chain with combo 1
    } else {
      // Invalid move, swap back
      audioService.playInvalid();
      const revertGrid = cloneGrid(newGrid);
      revertGrid[pos1.y][pos1.x].type = revertGrid[pos2.y][pos2.x].type;
      revertGrid[pos2.y][pos2.x].type = tempType; // revert
      setGrid(revertGrid);
      setGameState(GameState.IDLE);
    }
  };

  // Modified to accept currentCombo for audio syncing
  const processMatches = async (currentGrid: Grid, matchedIds: Set<string>, isToolAction = false, currentCombo = 1) => {
    setGameState(GameState.ANIMATING);
    if (!isToolAction) {
        audioService.playMatch(currentCombo);
    }

    // Update Combo State for UI
    setCombo(currentCombo);

    // 1. Mark matches
    const markedGrid = cloneGrid(currentGrid).map(row => row.map(tile => {
      if (matchedIds.has(tile.id)) {
        return { ...tile, isMatched: true };
      }
      return tile;
    }));
    setGrid(markedGrid);

    // Update Score
    setScore(s => s + matchedIds.size * 10 * currentCombo);

    // Wait for disappear animation
    await new Promise(r => setTimeout(r, 300));

    // 2. Remove and Drop - defer computation to avoid blocking
    await new Promise(r => setTimeout(r, 0));
    const droppedGrid = applyGravity(markedGrid);
    setGrid(droppedGrid);

    // Wait for drop "animation"
    await new Promise(r => setTimeout(r, 300));

    // 3. Fill top - defer computation to avoid blocking
    await new Promise(r => setTimeout(r, 0));
    const filledGrid = fillEmptyTiles(droppedGrid);
    setGrid(filledGrid);

    // 4. Check recursively - defer match finding to avoid blocking
    await new Promise(r => setTimeout(r, 0));
    const newMatches = findMatches(filledGrid);
    if (newMatches.size > 0) {
      // Pass incremented combo to next step
      await new Promise(r => setTimeout(r, 300)); // Delay between cascades
      await processMatches(filledGrid, newMatches, false, currentCombo + 1);
    } else {
      // Check level up or game over logic
      if (score > level * 1000) {
          setLevel(l => l + 1);
          setMoves(m => m + 5);
          // Give extra tools on level up
          setTools(prev => ({
            bomb: prev.bomb + 1,
            hint: prev.hint + 1,
            shuffle: prev.shuffle + 1
          }));
          audioService.playLevelUp();
      }
      // Finally set state to IDLE
      setGameState(GameState.IDLE);
      setCombo(0);
    }
  };

  const applyGravity = (currentGrid: Grid): Grid => {
    const newGrid: Grid = Array(BOARD_SIZE).fill(null).map(() => []);

    // Process column by column
    for (let x = 0; x < BOARD_SIZE; x++) {
      let colTiles: TileData[] = [];
      // Collect non-matched tiles
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (!currentGrid[y][x].isMatched) {
          colTiles.push(currentGrid[y][x]);
        }
      }
      
      // Place them at the bottom of the new column
      let dropIndex = BOARD_SIZE - 1;
      for (let i = colTiles.length - 1; i >= 0; i--) {
        newGrid[dropIndex][x] = { ...colTiles[i], y: dropIndex, x: x }; // Update coords
        dropIndex--;
      }
    }

    // Reconstruct full 8x8 grid structure
    const resultGrid: Grid = [];
    for(let y=0; y<BOARD_SIZE; y++) {
        const row: TileData[] = [];
        for(let x=0; x<BOARD_SIZE; x++) {
            // If the cell was filled by gravity logic
            if (newGrid[y] && newGrid[y][x]) {
                row.push(newGrid[y][x]);
            } else {
                // Placeholder for empty, will be filled next step
                 row.push({ id: `empty-${y}-${x}`, type: AnimalType.CAT, x, y, isMatched: true }); // isMatched true denotes empty here temporarily
            }
        }
        resultGrid.push(row);
    }
    return resultGrid;
  };

  const fillEmptyTiles = (currentGrid: Grid): Grid => {
    const newGrid = cloneGrid(currentGrid);
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (newGrid[y][x].id.startsWith('empty-') || newGrid[y][x].isMatched) {
          newGrid[y][x] = {
            id: `tile-${x}-${y}-${Date.now()}-${Math.random()}`,
            type: getRandomAnimal(),
            x,
            y,
            isNew: true
          };
        } else {
             newGrid[y][x].isNew = false;
        }
      }
    }
    return newGrid;
  };

  // Touch Event Handlers for Swipe
  const handleTouchStart = (e: React.TouchEvent, x: number, y: number) => {
    if (gameState !== GameState.IDLE) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    // Also select the tile on touch start if not using bomb
    if (activeTool !== 'BOMB') {
       handleTileClick(x, y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, x: number, y: number) => {
    if (!touchStartRef.current || gameState !== GameState.IDLE) return;
    
    // If using bomb, tap is handled by onClick, swipe shouldn't cancel it necessarily but let's keep it simple
    if (activeTool === 'BOMB') return;

    if (!selectedPos) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartRef.current.x;
    const diffY = touchEndY - touchStartRef.current.y;

    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    const threshold = 30; // Minimum pixel distance for a swipe

    if (Math.max(absDiffX, absDiffY) > threshold) {
      let targetX = x;
      let targetY = y;

      if (absDiffX > absDiffY) {
        // Horizontal
        targetX = diffX > 0 ? x + 1 : x - 1;
      } else {
        // Vertical
        targetY = diffY > 0 ? y + 1 : y - 1;
      }

      // Check bounds
      if (targetX >= 0 && targetX < BOARD_SIZE && targetY >= 0 && targetY < BOARD_SIZE) {
        handleSwap({ x, y }, { x: targetX, y: targetY });
        setSelectedPos(null); // Deselect after swipe attempt
        setHintTiles([]);
      }
    }

    touchStartRef.current = null;
  };

  const isGameOver = moves <= 0 && gameState === GameState.IDLE;

  return (
    <div className="flex flex-col h-screen w-screen max-w-full bg-white shadow-2xl relative select-none overflow-hidden">
      {/* Header / Stats */}
      <div className="p-3 bg-indigo-600 text-white flex justify-between items-center shadow-md z-10 shrink-0 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
             <Trophy size={20} className="text-yellow-300" />
             <span>第 {level} 关</span>
          </h1>
          <p className="text-indigo-200 text-xs">目标: {level * 1000} 分</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black font-mono">{score}</div>
          <div className="text-xs opacity-75">得分</div>
        </div>
        <div className="text-right">
             <div className="text-xl font-bold">{moves}</div>
             <div className="text-xs opacity-75">步数</div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-indigo-50 relative overflow-hidden min-h-0">
        
        {/* Combo Indicator */}
        {combo > 1 && (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full font-bold animate-bounce z-20 shadow-lg border-2 border-white whitespace-nowrap">
               {combo} 连击!
             </div>
        )}

        {/* Board */}
        <div 
          className="relative bg-indigo-200 rounded-lg shadow-inner cursor-pointer"
          style={{
            width: 'min(100%, 85vw)',
            height: 'min(100%, 85vw)',
          }}
        >
          {grid.map((row, y) => (
            <React.Fragment key={y}>
              {row.map((tile, x) => (
                <Tile
                  key={tile.id}
                  tile={tile}
                  isSelected={selectedPos?.x === x && selectedPos?.y === y}
                  isHint={hintTiles.some(pos => pos.x === x && pos.y === y)}
                  onClick={() => handleTileClick(x, y)}
                  style={{
                    width: `${100 / BOARD_SIZE}%`,
                    height: `${100 / BOARD_SIZE}%`,
                    left: `${(x / BOARD_SIZE) * 100}%`,
                    top: `${(y / BOARD_SIZE) * 100}%`,
                  }}
                >
                  {/* Invisible touch overlay for gesture capture */}
                  <div 
                    className="absolute inset-0 z-10"
                    onTouchStart={(e) => handleTouchStart(e, x, y)}
                    onTouchEnd={(e) => handleTouchEnd(e, x, y)}
                  />
                </Tile>
              ))}
            </React.Fragment>
          ))}
          
          {/* Bomb Overlay Text */}
          {activeTool === 'BOMB' && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black/10 rounded-lg">
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                    请点击消除区域
                </span>
            </div>
          )}
        </div>
      </div>

      {/* Tools Bar */}
      <div className="bg-indigo-50 px-3 py-1 flex justify-center gap-2 shrink-0 flex-wrap">
          <button 
            disabled={tools.bomb === 0 || gameState !== GameState.IDLE}
            onClick={() => setActiveTool(activeTool === 'BOMB' ? null : 'BOMB')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20
                ${activeTool === 'BOMB' ? 'bg-red-100 ring-2 ring-red-500 scale-105' : 'bg-white hover:bg-gray-50'}
                ${(tools.bomb === 0 || gameState !== GameState.IDLE) ? 'opacity-50 grayscale' : 'shadow-sm'}
            `}
          >
            <div className="relative">
                <Bomb className="text-red-500" size={24} />
                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {tools.bomb}
                </span>
            </div>
            <span className="text-xs font-bold text-slate-600">炸弹</span>
          </button>

          <button 
            disabled={tools.hint === 0 || gameState !== GameState.IDLE}
            onClick={useHint}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 bg-white hover:bg-gray-50 shadow-sm
                ${(tools.hint === 0 || gameState !== GameState.IDLE) ? 'opacity-50 grayscale' : ''}
            `}
          >
             <div className="relative">
                <Lightbulb className="text-yellow-500" size={24} />
                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {tools.hint}
                </span>
            </div>
            <span className="text-xs font-bold text-slate-600">提示</span>
          </button>

          <button 
            disabled={tools.shuffle === 0 || gameState !== GameState.IDLE}
            onClick={useShuffle}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 bg-white hover:bg-gray-50 shadow-sm
                ${(tools.shuffle === 0 || gameState !== GameState.IDLE) ? 'opacity-50 grayscale' : ''}
            `}
          >
             <div className="relative">
                <Shuffle className="text-blue-500" size={24} />
                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {tools.shuffle}
                </span>
            </div>
            <span className="text-xs font-bold text-slate-600">重排</span>
          </button>
      </div>

      {/* Footer / Restart */}
      <div className="p-3 bg-white border-t border-indigo-100 flex justify-center shrink-0">
        <button 
          onClick={startNewGame}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-full font-bold hover:bg-indigo-200 active:scale-95 transition-colors"
        >
          <RotateCcw size={20} />
          <span>重新开始</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={40} className="text-yellow-500" fill="currentColor" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">游戏结束!</h2>
            <p className="text-slate-500 mb-6">太棒了！你最终获得了</p>
            
            <div className="bg-indigo-50 rounded-xl p-4 mb-8">
              <div className="text-4xl font-black text-indigo-600 mb-1">{score}</div>
              <div className="text-sm text-indigo-400 font-bold uppercase tracking-wider">总得分</div>
            </div>

            <button 
              onClick={startNewGame}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
