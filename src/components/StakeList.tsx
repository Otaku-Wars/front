import React from 'react';
import { StakeListItem } from './StakeListItem';
import { useCharacterStakes } from '../hooks/api';
import './StakeList.css';

interface StakeListProps {
  characterId: number;
  characterImage: string;
}

export const StakeList: React.FC<StakeListProps> = ({ characterId, characterImage }) => {
  const { data: stakes, isLoading, isError } = useCharacterStakes(characterId);

  if (isLoading) return <div className="stake-list-loading">Loading stakes...</div>;
  if (isError) return <div className="stake-list-error">Error loading stakes. Please try again.</div>;
  if (!stakes || stakes.length === 0) return <div className="stake-list-empty">No stakes found.</div>;

  return (
    <div className="stake-list">
      <div className="stake-list-header">
        <div className="header-user">User</div>
        <div className="header-action">Action</div>
        <div className="header-amount">Amount Staked</div>
        <div className="header-impact">Stats impact</div>
        <div className="header-final">Final</div>
        <div className="header-timestamp">Timestamp</div>
      </div>
      {stakes.map((stake) => (
        <StakeListItem key={stake.timestamp} activity={stake} characterImage={characterImage} />
      ))}
    </div>
  );
};