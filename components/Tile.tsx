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
    case AnimalType.BIRD: emoji = '🐦'; break;
    case AnimalType.FISH: emoji = '🐠'; break;
    default: emoji = '❓';
  }
  return <span className={`${className} leading-none flex items-center justify-center`} style={{ fontSize: 'min(36px, 8vw)' }}>{emoji}</span>;
};

const getColors = (type: AnimalType) => {
  switch (type) {
    case AnimalType.CAT: return 'bg-orange-100 border-orange-300';
    case AnimalType.DOG: return 'bg-blue-100 border-blue-300';
    case AnimalType.RABBIT: return 'bg-pink-100 border-pink-300';
    case AnimalType.BEAR: return 'bg-amber-100 border-amber-400';
    case AnimalType.BIRD: return 'bg-yellow-100 border-yellow-300';
    case AnimalType.FISH: return 'bg-cyan-100 border-cyan-300';
    default: return 'bg-gray-100';
  }
};

const Tile: React.FC<TileProps> = ({ tile, isSelected, isHint, onClick, style, children }) => {
  const colors = getColors(tile.type);
  
  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        absolute w-full h-full p-1 transition-all duration-300 ease-in-out
        ${tile.isMatched ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
      `}
    >
      <div 
        className={`
          relative w-full h-full rounded-xl flex items-center justify-center border-b-4
          shadow-sm transition-transform duration-100 select-none cursor-pointer
          ${colors}
          ${isSelected ? 'ring-4 ring-offset-2 ring-indigo-500 brightness-110 -translate-y-1' : ''}
          ${isHint ? 'ring-4 ring-offset-2 ring-green-400 animate-pulse' : ''}
          active:scale-95
        `}
      >
        <AnimalEmoji type={tile.type} className="w-full h-full" />
        {children}
      </div>
    </div>
  );
};

export default Tile;