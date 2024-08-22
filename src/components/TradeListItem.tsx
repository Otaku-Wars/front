import React from 'react';
import { TradeActivity } from '@memeclashtv/types/activity';
import './TradeListItem.css';

interface TradeListItemProps {
  activity: TradeActivity;
  characterImage: string;
}

export const TradeListItem: React.FC<TradeListItemProps> = ({ activity, characterImage }) => {
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
    return `${minutes} min ago`;
  };

  const formatPriceImpact = (prevPrice: number, newPrice: number) => {
    const impact = ((newPrice - prevPrice) / prevPrice) * 100;
    const sign = impact >= 0 ? '+' : '';
    return `${sign}${impact.toFixed(2)}%`;
  };

  return (
    <div className="trade-list-item">
      <div className="trade-user">
        <img src={`https://avatars.dicebear.com/api/identicon/${activity.trader}.svg`} alt="User avatar" className="user-avatar" />
        <span className="user-address">{shortenAddress(activity.trader)}</span>
      </div>
      <div className={`trade-type ${activity.isBuy ? 'bought' : 'sold'}`}>
        {activity.isBuy ? 'BOUGHT' : 'SOLD'}
      </div>
      <div className="trade-amount">
        <img src={characterImage} alt="Character" className="character-icon" />
        {activity.shareAmount.toLocaleString()}
      </div>
      <div className="trade-cost">
        for ${activity.ethAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className={`trade-price-impact ${activity.newPrice >= activity.prevPrice ? 'positive' : 'negative'}`}>
        ${activity.newPrice.toFixed(2)} {formatPriceImpact(activity.prevPrice, activity.newPrice)}
      </div>
      <div className="trade-timestamp">
        {formatTimestamp(activity.timestamp)}
      </div>
    </div>
  );
};
