import React from 'react';
import { MatchEndActivity } from '@memeclashtv/types/activity';
import './MatchListItem.css';
import { Character } from '@memeclashtv/types';

interface MatchListItemProps {
  characterId: number;
  activity: MatchEndActivity;
  characters: Character[];
}

export const MatchListItem: React.FC<MatchListItemProps> = ({ characterId, activity, characters }) => {
  console.log("activity: ", activity);
  const formatChange = (prevValue: number, newValue: number) => {
    const change = ((newValue - prevValue) / prevValue) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
    return `${minutes} min ago`;
  };

  const getCharacterInfo = (playerId: number) => {
    const character = characters.find(c => c.id === playerId);
    return {
      name: character ? character.name : `Player ${playerId}`,
      pfpUrl: character ? character.pfp : `/character-images/${playerId}.png`
    };
  };

  const renderPlayerInfo = (playerId: number, state: typeof activity.state1, playerNumber: number) =>{
    const { name, pfpUrl } = getCharacterInfo(playerId);
    return (
      <div className="player">
        <img src={pfpUrl} alt={name} className="player-avatar" />
        <div className="player-info">
          <div className="player-name">{name}</div>
          <div className="player-price">Price: ${activity.tokenState[`newPrice${playerNumber}`].toFixed(2)}</div>
          <div className="player-market-cap">MktCap: ${activity.tokenState[`newMarketCap${playerNumber}`].toLocaleString()}</div>
          <div className="player-stats">
            <span className="stat health">{state.health}</span>
            <span className="stat power">{state.power}</span>
            <span className="stat attack">{state.attack}</span>
            <span className="stat defense">{state.defense}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="match-list-item">
      {renderPlayerInfo(activity.p1, activity.state1, 1)}
      <div className="vs">vs</div>
      {renderPlayerInfo(activity.p2, activity.state2, 2)}
      <div className="match-result">
        <div className={`result ${activity.winner === characterId ? 'won' : 'lost'}`}>
          {activity.winner === characterId ? 'Won' : 'Lost'}
        </div>
        <div className="price-change">
          {formatChange(activity.tokenState.prevPrice1, activity.tokenState.newPrice1)}
        </div>
        <div className="market-cap-change">
          {formatChange(activity.tokenState.prevMarketCap1, activity.tokenState.newMarketCap1)}
        </div>
      </div>
      <div className="timestamp">{formatTimestamp(activity.timestamp)}</div>
    </div>
  );
};