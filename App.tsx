import React, { useState, useEffect, useRef } from 'react';
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
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  
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

  // Touch/Mouse Event Handlers for Drag
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>, x: number, y: number) => {
    if (gameState !== GameState.IDLE) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    touchStartRef.current = { x: clientX, y: clientY };
    setDragOffset({ x: 0, y: 0 });
    
    // Select the tile on touch start
    if (activeTool !== 'BOMB') {
      // If already selected the same tile, keep it selected for dragging
      if (selectedPos && selectedPos.x === x && selectedPos.y === y) {
        return;
      }
      setSelectedPos({ x, y });
      setHintTiles([]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !selectedPos || gameState !== GameState.IDLE || activeTool === 'BOMB') return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const offsetX = clientX - touchStartRef.current.x;
    const offsetY = clientY - touchStartRef.current.y;
    
    const absDiffX = Math.abs(offsetX);
    const absDiffY = Math.abs(offsetY);
    
    // 只允许水平或垂直移动，不允许斜向
    let displayOffsetX = offsetX;
    let displayOffsetY = offsetY;
    
    if (absDiffX > absDiffY) {
      // 水平方向为主，清除垂直偏移
      displayOffsetY = 0;
    } else if (absDiffY > absDiffX) {
      // 垂直方向为主，清除水平偏移
      displayOffsetX = 0;
    } else {
      // 两个方向相同，都清除（要求严格的横纵移动）
      displayOffsetX = 0;
      displayOffsetY = 0;
    }
    
    setDragOffset({ x: displayOffsetX, y: displayOffsetY });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || gameState !== GameState.IDLE) return;
    
    // If using bomb, tap is handled by onClick
    if (activeTool === 'BOMB') {
      setDragOffset(null);
      touchStartRef.current = null;
      return;
    }

    if (!selectedPos) {
      setDragOffset(null);
      touchStartRef.current = null;
      return;
    }

    const touchEndX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const touchEndY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY;

    const diffX = touchEndX - touchStartRef.current.x;
    const diffY = touchEndY - touchStartRef.current.y;

    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    const threshold = 30; // Minimum pixel distance for a valid drag

    // Valid drag: moved more than threshold pixels
    if (Math.max(absDiffX, absDiffY) > threshold) {
      let targetX = selectedPos.x;
      let targetY = selectedPos.y;

      // Only move if one direction is significantly dominant
      if (absDiffX > absDiffY) {
        // Horizontal drag - only move horizontally
        targetX = diffX > 0 ? selectedPos.x + 1 : selectedPos.x - 1;
      } else if (absDiffY > absDiffX) {
        // Vertical drag - only move vertically
        targetY = diffY > 0 ? selectedPos.y + 1 : selectedPos.y - 1;
      } else {
        // 两个方向相同，取消交换
        setSelectedPos(null);
        setHintTiles([]);
        setDragOffset(null);
        touchStartRef.current = null;
        return;
      }

      // Check bounds and ensure only one cell away
      if (targetX >= 0 && targetX < BOARD_SIZE && targetY >= 0 && targetY < BOARD_SIZE) {
        // Verify it's exactly adjacent (one cell away)
        if (Math.abs(targetX - selectedPos.x) + Math.abs(targetY - selectedPos.y) === 1) {
          handleSwap({ x: selectedPos.x, y: selectedPos.y }, { x: targetX, y: targetY });
        }
      }
      setSelectedPos(null);
      setHintTiles([]);
    } else {
      // Invalid drag: not enough movement, deselect
      setSelectedPos(null);
    }

    setDragOffset(null);
    touchStartRef.current = null;
  };

  const isGameOver = moves <= 0 && gameState === GameState.IDLE;

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-blue-50 via-green-50 to-teal-50 relative select-none">
      <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full">
      {/* Header / Stats */}
      <div className="p-4 bg-gradient-to-r from-blue-100 via-green-100 to-teal-100 text-blue-800 flex justify-between items-center z-10 shrink-0 flex-wrap gap-3">
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
             <span className="text-2xl">🏆</span>
             <span>第 {level} 关</span>
          </h1>
          <p className="text-blue-600 text-xs font-semibold">目标: {level * 1000} 分</p>
        </div>
        <div className="text-center flex-1 px-4">
          <div className="text-4xl font-black font-mono text-blue-500">{score}</div>
          <div className="text-xs opacity-70 font-bold tracking-widest text-blue-600">得分</div>
        </div>
        <div className="text-right flex-shrink-0">
             <div className="text-2xl font-bold text-blue-600">{moves}</div>
             <div className="text-xs opacity-70 font-bold tracking-widest text-blue-600">步数</div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-blue-30 via-green-30 to-teal-30 relative min-h-0">
        
        {/* Combo Indicator */}
        {combo > 1 && (
             <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-200 to-orange-200 text-slate-700 px-6 py-2 rounded-full font-bold animate-bounce z-20 border-2 border-white whitespace-nowrap text-lg">
               ✨ {combo} 连击! ✨
             </div>
        )}

        {/* Board */}
        <div 
          className="relative bg-gradient-to-br from-blue-100 via-green-100 to-teal-100 rounded-2xl cursor-pointer border-2 border-blue-200"
          data-board
          style={{
            width: 'clamp(280px, 90vw, 480px)',
            height: 'clamp(280px, 90vw, 480px)',
            aspectRatio: '1 / 1'
          }}
          onMouseDown={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / (rect.width / BOARD_SIZE));
            const y = Math.floor((e.clientY - rect.top) / (rect.height / BOARD_SIZE));
            if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
              handleTouchStart(e, x, y);
            }
          }}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onTouchStart={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const x = Math.floor((e.touches[0].clientX - rect.left) / (rect.width / BOARD_SIZE));
            const y = Math.floor((e.touches[0].clientY - rect.top) / (rect.height / BOARD_SIZE));
            if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
              handleTouchStart(e, x, y);
            }
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                  dragOffset={selectedPos?.x === x && selectedPos?.y === y ? dragOffset : null}
                  style={{
                    width: `${100 / BOARD_SIZE}%`,
                    height: `${100 / BOARD_SIZE}%`,
                    left: `${(x / BOARD_SIZE) * 100}%`,
                    top: `${(y / BOARD_SIZE) * 100}%`,
                  }}
                />
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
      <div className="bg-gradient-to-r from-blue-100 via-green-100 to-teal-100 px-4 py-3 flex justify-center gap-3 shrink-0 flex-wrap">
          <button 
            disabled={tools.bomb === 0 || gameState !== GameState.IDLE}
            onClick={() => setActiveTool(activeTool === 'BOMB' ? null : 'BOMB')}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-24 font-semibold
                ${activeTool === 'BOMB' ? 'bg-red-100 ring-3 ring-red-200 scale-105 text-red-700' : 'bg-white text-slate-700 hover:bg-slate-50'}
                ${(tools.bomb === 0 || gameState !== GameState.IDLE) ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-gray-100'}
            `}
          >
            <div className="relative">
                <span className="text-4xl">💣</span>
                <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                    {tools.bomb}
                </span>
            </div>
            <span className="text-xs font-bold">炸弹</span>
          </button>

          <button 
            disabled={tools.hint === 0 || gameState !== GameState.IDLE}
            onClick={useHint}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-24 font-semibold
                ${tools.hint > 0 && gameState === GameState.IDLE ? 'bg-yellow-100 text-slate-800' : 'bg-white text-slate-400'}
                ${(tools.hint === 0 || gameState !== GameState.IDLE) ? 'opacity-40 grayscale cursor-not-allowed' : 'text-slate-700 hover:bg-gray-100'}
            `}
          >
             <div className="relative">
                <span className="text-4xl">💡</span>
                <span className="absolute -top-3 -right-3 bg-amber-500 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                    {tools.hint}
                </span>
            </div>
            <span className="text-xs font-bold">提示</span>
          </button>

          <button 
            disabled={tools.shuffle === 0 || gameState !== GameState.IDLE}
            onClick={useShuffle}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all w-24 font-semibold
                ${tools.shuffle > 0 && gameState === GameState.IDLE ? 'bg-cyan-100 text-slate-800' : 'bg-white text-slate-400'}
                ${(tools.shuffle === 0 || gameState !== GameState.IDLE) ? 'opacity-40 grayscale cursor-not-allowed' : 'text-slate-700 hover:bg-gray-100'}
            `}
          >
             <div className="relative">
                <span className="text-4xl">🔀</span>
                <span className="absolute -top-3 -right-3 bg-blue-500 text-white text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                    {tools.shuffle}
                </span>
            </div>
            <span className="text-xs font-bold">重排</span>
          </button>
      </div>

      {/* Footer / Restart */}
      <div className="p-4 bg-gradient-to-r from-blue-100 to-green-100 border-t border-blue-200 flex justify-center shrink-0">
        <button 
          onClick={startNewGame}
          className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-emerald-300 to-teal-300 text-white rounded-full font-bold text-lg hover:from-emerald-200 hover:to-teal-200 active:scale-95 transition-all"
        >
          <span className="text-2xl">🔄</span>
          <span>重新开始</span>
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-white to-green-50 rounded-3xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in duration-300 border-2 border-blue-200">
            <div className="text-6xl mb-6">✨</div>
            
            <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">游戏结束!</h2>
            <p className="text-slate-600 mb-8 text-lg font-semibold">太棒了！你最终获得了</p>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border-2 border-blue-200">
              <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">{score}</div>
              <div className="text-sm text-blue-500 font-bold uppercase tracking-widest">总得分</div>
            </div>

            <button 
              onClick={startNewGame}
              className="w-full py-4 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-xl font-bold text-lg hover:from-blue-300 hover:to-green-300 active:scale-95 transition-all"
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default App;
