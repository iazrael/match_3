/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { AnimalType, TileData } from '../types';

interface TileProps {
  tile: TileData;
  isSelected: boolean;
  isHint?: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const AnimalEmoji: React.FC<{ type: AnimalType; className?: string }> = ({ type, className }) => {
  let emoji = '';
  switch (type) {
    case AnimalType.CAT: emoji = '🐱'; break;
    case AnimalType.DOG: emoji = '🐶'; break;
    case AnimalType.RABBIT: emoji = '🐰'; break;
    case AnimalType.BEAR: emoji = '🐻'; break;
    case AnimalType.FROG: emoji = '🐸'; break;
    case AnimalType.FISH: emoji = '🐠'; break;
    default: emoji = '❓';
  }
  return <span className={`${className} leading-none flex items-center justify-center`} style={{ fontSize: 'min(42px, 10vw)' }}>{emoji}</span>;
};

const getColors = (type: AnimalType) => {
  switch (type) {
    case AnimalType.CAT: return 'bg-orange-50 border-orange-200';
    case AnimalType.DOG: return 'bg-blue-50 border-blue-200';
    case AnimalType.RABBIT: return 'bg-pink-50 border-pink-200';
    case AnimalType.BEAR: return 'bg-amber-50 border-amber-200';
    case AnimalType.FROG: return 'bg-green-50 border-green-200';
    case AnimalType.FISH: return 'bg-cyan-50 border-cyan-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

const Tile: React.FC<TileProps> = ({ tile, isSelected, isHint, onClick, style, children }) => {
  const colors = getColors(tile.type);
  
  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        absolute w-full h-full p-1.5 transition-all duration-300 ease-in-out
        ${tile.isMatched ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
      `}
    >
      <div 
        className={`
          relative w-full h-full rounded-xl flex items-center justify-center border-2
          transition-all duration-100 select-none cursor-pointer aspect-square
          ${colors}
          ${isSelected ? 'ring-4 ring-offset-2 ring-blue-400 brightness-110 -translate-y-2 scale-105' : ''}
          ${isHint ? 'ring-4 ring-offset-2 ring-green-400 animate-pulse' : ''}
          active:scale-95 hover:brightness-105
        `}
      >
        <AnimalEmoji type={tile.type} className="w-full h-full" />
        {children}
      </div>
    </div>
  );
};

export default Tile;