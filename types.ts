export enum AnimalType {
  CAT = 'CAT',
  DOG = 'DOG',
  RABBIT = 'RABBIT',
  BEAR = 'BEAR',
  BIRD = 'BIRD',
  FISH = 'FISH'
}

export interface TileData {
  id: string; // Unique ID for React keys
  type: AnimalType;
  x: number;
  y: number;
  isMatched?: boolean;
  isNew?: boolean; // For entry animation
}

export type Grid = TileData[][];

export enum GameState {
  IDLE = 'IDLE',
  SWAPPING = 'SWAPPING',
  CHECKING = 'CHECKING',
  ANIMATING = 'ANIMATING'
}

export interface Coordinate {
  x: number;
  y: number;
}