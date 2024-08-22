import React from 'react';
import { StakeActivity } from '@memeclashtv/types/activity';
import './StakeListItem.css';

interface StakeListItemProps {
  activity: StakeActivity;
  characterImage: string;
}

export const StakeListItem: React.FC<StakeListItemProps> = ({ activity, characterImage }) => {
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
    return `${minutes} min ago`;
  };

  const getAttributeIcon = (attribute: number) => {
    switch (attribute) {
      case 0: return '❤️'; // health
      case 1: return '💪'; // power
      case 2: return '⚔️'; // attack
      case 3: return '🛡️'; // defense
      case 4: return '⚡'; // speed
      default: return '❓';
    }
  };

  const statIncrease = activity.newAttribute - activity.prevAttribute;

  return (
    <div className="stake-list-item">
      <div className="stake-user">
        <img src={`https://avatars.dicebear.com/api/identicon/${activity.staker}.svg`} alt="User avatar" className="user-avatar" />
        <span className="user-address">{shortenAddress(activity.staker)}</span>
      </div>
      <div className="stake-action">
        {activity.amount > 0 ? 'STAKE' : activity.amount < 0 ? 'UNSTAKE' : ''}
      </div>
      <div className="stake-amount">
        <img src={characterImage} alt="Character" className="character-icon" />
        {activity.amount.toLocaleString()} for {getAttributeIcon(activity.attribute)}
      </div>
      <div className="stake-impact">
        +{statIncrease}
      </div>
      <div className="stake-final">
        {activity.newAttribute.toLocaleString()} {getAttributeIcon(activity.attribute)}
      </div>
      <div className="stake-timestamp">
        {formatTimestamp(activity.timestamp)}
      </div>
    </div>
  );
};