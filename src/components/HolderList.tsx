import React from 'react';
import { User } from '@memeclashtv/types';
import { HolderListItem } from './HolderListItem';
import { useCharacterHolders } from '../hooks/api';
import './HolderList.css';

interface HolderListProps {
  characterId: number;
  characterSupply: number;
  characterMarketCap: number;
}

export const HolderList: React.FC<HolderListProps> = ({ characterId, characterSupply, characterMarketCap }) => {
  const { data: holders, isLoading, isError } = useCharacterHolders(characterId);

  if (isLoading) {
    return <div className="holder-list-loading">Loading holders...</div>;
  }

  if (isError) {
    return <div className="holder-list-error">Error loading holders. Please try again later.</div>;
  }

  if (!holders || holders.length === 0) {
    return <div className="holder-list-empty">No holders found for this character.</div>;
  }

  return (
    <div className="holder-list">
      <div className="holder-list-header">
        <div className="header-rank">Rank</div>
        <div className="header-user">User</div>
        <div className="header-holdings">Holdings</div>
        <div className="header-value">Value</div>
      </div>
      {holders.map((holder, index) => (
        <HolderListItem 
          key={holder.address} 
          user={holder} 
          rank={index + 1} 
          characterId={characterId}
          characterSupply={characterSupply}
          characterMarketCap={characterMarketCap}
        />
      ))}
    </div>
  );
};
