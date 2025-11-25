import { AnimalType, Grid, TileData, Coordinate } from '../types';

export const BOARD_SIZE = 8;
export const ANIMAL_TYPES = [
  AnimalType.CAT,
  AnimalType.DOG,
  AnimalType.RABBIT,
  AnimalType.BEAR,
  AnimalType.BIRD,
  AnimalType.FISH
];

export const getRandomAnimal = (): AnimalType => {
  return ANIMAL_TYPES[Math.floor(Math.random() * ANIMAL_TYPES.length)];
};

// Create an initial board with no initial matches
export const createBoard = (): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      let type: AnimalType;
      do {
        type = getRandomAnimal();
      } while (
        (x >= 2 && row[x - 1].type === type && row[x - 2].type === type) ||
        (y >= 2 && grid[y - 1][x].type === type && grid[y - 2][x].type === type)
      );
      
      row.push({
        id: `tile-${x}-${y}-${Date.now()}-${Math.random()}`,
        type,
        x,
        y
      });
    }
    grid.push(row);
  }
  return grid;
};

// Check for matches on the entire board
export const findMatches = (grid: Grid): Set<string> => {
  const matchedIds = new Set<string>();

  // Horizontal check
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE - 2; x++) {
      const type = grid[y][x].type;
      let matchLength = 1;
      while (x + matchLength < BOARD_SIZE && grid[y][x + matchLength].type === type) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matchedIds.add(grid[y][x + i].id);
        }
        x += matchLength - 1; // Skip checked
      }
    }
  }

  // Vertical check
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE - 2; y++) {
      const type = grid[y][x].type;
      let matchLength = 1;
      while (y + matchLength < BOARD_SIZE && grid[y + matchLength][x].type === type) {
        matchLength++;
      }
      if (matchLength >= 3) {
        for (let i = 0; i < matchLength; i++) {
          matchedIds.add(grid[y + i][x].id);
        }
        y += matchLength - 1; // Skip checked
      }
    }
  }

  return matchedIds;
};

// Find a possible move (Hint logic)
export const findPossibleMove = (grid: Grid): [Coordinate, Coordinate] | null => {
  const tempGrid = cloneGrid(grid);

  // Helper to swap and check
  const checkSwap = (x1: number, y1: number, x2: number, y2: number) => {
    // Swap
    const temp = tempGrid[y1][x1].type;
    tempGrid[y1][x1].type = tempGrid[y2][x2].type;
    tempGrid[y2][x2].type = temp;

    const matches = findMatches(tempGrid);
    
    // Swap back
    tempGrid[y2][x2].type = tempGrid[y1][x1].type;
    tempGrid[y1][x1].type = temp;

    return matches.size > 0;
  };

  // Check horizontal swaps
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE - 1; x++) {
      if (checkSwap(x, y, x + 1, y)) {
        return [{ x, y }, { x: x + 1, y }];
      }
    }
  }

  // Check vertical swaps
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE - 1; y++) {
      if (checkSwap(x, y, x, y + 1)) {
        return [{ x, y }, { x, y: y + 1 }];
      }
    }
  }

  return null;
};

// Clone grid helper
export const cloneGrid = (grid: Grid): Grid => {
  return grid.map(row => row.map(tile => ({ ...tile })));
};