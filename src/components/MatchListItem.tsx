import React from 'react';
import { MatchEndActivity } from '@memeclashtv/types/activity';
import './MatchListItem.css';

interface MatchListItemProps {
  activity: MatchEndActivity;
}

export const MatchListItem: React.FC<MatchListItemProps> = ({ activity }) => {
  const formatChange = (prevValue: number, newValue: number) => {
    const change = ((newValue - prevValue) / prevValue) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatTimestamp = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
    return `${minutes} min ago`;
  };

  const renderPlayerInfo = (playerId: number, state: typeof activity.state1) => (
    <div className="player">
      <img src={`/character-images/${playerId}.png`} alt={`Player ${playerId}`} className="player-avatar" />
      <div className="player-info">
        <div className="player-name">Player {playerId}</div>
        <div className="player-price">Price: ${activity.tokenState[`newPrice${playerId}`].toFixed(2)}</div>
        <div className="player-market-cap">MktCap: ${activity.tokenState[`newMarketCap${playerId}`].toLocaleString()}</div>
        <div className="player-stats">
          <span className="stat health">{state.health}</span>
          <span className="stat power">{state.power}</span>
          <span className="stat attack">{state.attack}</span>
          <span className="stat defense">{state.defense}</span>
          <span className="stat speed">{state.speed}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="match-list-item">
      {renderPlayerInfo(1, activity.state1)}
      <div className="vs">vs</div>
      {renderPlayerInfo(2, activity.state2)}
      <div className="match-result">
        <div className={`result ${activity.winner === activity.p1 ? 'won' : 'lost'}`}>
          {activity.winner === activity.p1 ? 'Won' : 'Lost'}
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