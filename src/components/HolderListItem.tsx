import React from 'react';
import { User } from '@memeclashtv/types';
import './HolderListItem.css';
import { getSellPrice } from '../utils';

interface HolderListItemProps {
  user: User;
  rank: number;
  characterId: number;
  characterSupply: number;
  characterMarketCap: number;
}

export const HolderListItem: React.FC<HolderListItemProps> = ({ 
    user, 
    rank, 
    characterId, 
    characterSupply, 
    characterMarketCap 
}) => {
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };    

  const getHoldings = () => {
    const balance = user.balances.find(b => b.character === characterId);
    return balance ? balance.balance : 0;
  };

  const holdings = getHoldings();
  const value = getSellPrice(characterSupply, characterMarketCap, holdings);

  return (
    <div className="holder-list-item">
      <div className="holder-rank">#{rank}</div>
      <div className="holder-user">
        <span className="holder-address">{shortenAddress(user.address)}</span>
      </div>
      <div className="holder-holdings">{holdings.toLocaleString()}</div>
      <div className="holder-value">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
  );
};
