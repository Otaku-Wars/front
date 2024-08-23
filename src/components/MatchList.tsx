import React from 'react';
import { MatchEndActivity } from '@memeclashtv/types/activity';
import { MatchListItem } from './MatchListItem';
import { useCharacterMatches } from '../hooks/api';
import './MatchList.css';
import { Character } from '@memeclashtv/types';

interface MatchListProps {
  characterId: number;
  characters: Character[];
}

export const MatchList: React.FC<MatchListProps> = ({ characterId, characters }) => {
  const { data: activities, isLoading, isError } = useCharacterMatches(characterId);

  if (isLoading) {
    return <div className="match-list-loading">Loading match history...</div>;
  }

  if (isError) {
    return <div className="match-list-error">Error loading match history. Please try again later.</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="match-list-empty">No match history available.</div>;
  }

  return (
    <div className="match-list">
      <div className="match-list-header">
        <div className="header-player">Player 1</div>
        <div className="header-player">Player 2</div>
        <div className="header-result">Results</div>
        <div className="header-price-change">Price Change</div>
        <div className="header-mktcap-change">MktCap change</div>
        <div className="header-timestamp">Timestamp</div>
      </div>
      {activities.map((activity, index) => (
        <MatchListItem key={`${activity.timestamp}-${index}`} activity={activity} characters={characters} characterId={characterId} />
      ))}
    </div>
  );
};
