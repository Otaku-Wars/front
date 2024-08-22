import React from 'react';
import { TradeActivity } from '@memeclashtv/types/activity';
import { TradeListItem } from './TradeListItem';
import { useCharacterTrades } from '../hooks/api';
import './TradeList.css';

interface TradeListProps {
  characterId: number;
  characterImage: string;
}

export const TradeList: React.FC<TradeListProps> = ({ characterId, characterImage }) => {
  const { data: trades, isLoading, isError } = useCharacterTrades(characterId);

  if (isLoading) {
    return <div className="trade-list-loading">Loading trades...</div>;
  }

  if (isError) {
    return <div className="trade-list-error">Error loading trades. Please try again.</div>;
  }

  if (!trades || trades.length === 0) {
    return <div className="trade-list-empty">No trades found.</div>;
  }

  return (
    <div className="trade-list">
      <div className="trade-list-header">
        <div className="header-user">User</div>
        <div className="header-type">Buy/Sell</div>
        <div className="header-amount">Amount</div>
        <div className="header-cost">Cost</div>
        <div className="header-price-impact">Price impact</div>
        <div className="header-timestamp">Timestamp</div>
      </div>
      {trades.map((trade) => (
        <TradeListItem key={trade.timestamp} activity={trade} characterImage={characterImage} />
      ))}
    </div>
  );
};
