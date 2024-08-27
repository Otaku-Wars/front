import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, useSellShares, useSellPrice } from '../hooks/contract';
import { useAddress, useBalance } from '../hooks/user';
import { convertEthToUsd } from './CharacterList';
import { parseEther, formatEther } from 'viem';

interface ModalBuySellProps {
  show: boolean;
  handleClose: () => void;
  actionType: 'Buy' | 'Sell';
  characterName: string;
  characterId: number;
}

export const ModalBuySell: React.FC<ModalBuySellProps> = ({ 
  show, 
  handleClose, 
  actionType, 
  characterName, 
  characterId 
}) => {
  const [amount, setAmount] = useState(0);
  const address = useAddress();
  const [currentAction, setCurrentAction] = useState(actionType);

  const { 
    data: buyPrice, 
    isPending: isPriceLoading, 
    error: priceError 
  } = useBuyPrice(characterId, BigInt(amount ?? 0));

  const {
    data: sellPrice,
    isPending: isSellPriceLoading,
    error: sellPriceError
  } = useSellPrice(characterId, BigInt(amount ?? 0));

  const { 
    buyShares, 
    isPending: isBuying, 
    error: buyError, 
    isSuccess: buySuccess 
  } = useBuyShares(characterId, BigInt(amount ?? 0), parseEther(buyPrice?.toString() ?? '0'));

  const userBalance = useBalance(address as `0x${string}`);

  const { 
    sellShares, 
    isPending: isSelling, 
    error: sellError, 
    isSuccess: sellSuccess 
  } = useSellShares(characterId, BigInt(amount ?? 0));

  const {data: yourShares} = useCharacterSharesBalance(characterId ?? 0, address);

  useEffect(() => {
    setCurrentAction(actionType);
  }, [actionType]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value === '' ? '0' : e.target.value);
    setAmount(value);
  };

  const handlePlaceTrade = () => {
    if (currentAction === 'Buy') {
      buyShares();
    } else {
      sellShares();
    }
  };

  const incrementAmount = () => setAmount(amount + 1);
  const decrementAmount = () => amount > 0 && setAmount(amount - 1);

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentAction} {characterName}</DialogTitle>
          <DialogDescription>
            You own: {yourShares} shares of {characterName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setCurrentAction('Buy')}>Buy</Button>
            <Button variant="outline" onClick={() => setCurrentAction('Sell')}>Sell</Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decrementAmount}>-</Button>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="col-span-2"
              />
              <Button variant="outline" size="icon" onClick={incrementAmount}>+</Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Balance</Label>
            <div className="col-span-3">
              ${convertEthToUsd(parseFloat(formatEther(userBalance?.balance ?? BigInt(0))))} ({formatEther(userBalance?.balance ?? BigInt(0))} ETH)
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Est. Cost</Label>
            <div className="col-span-3">
              {isPriceLoading || isSellPriceLoading ? 
                'Loading...' : 
                currentAction === 'Buy' ?
                  `$${convertEthToUsd(parseFloat(formatEther(buyPrice ?? BigInt(0))))} (${formatEther(buyPrice ?? BigInt(0))} ETH)` :
                  `$${convertEthToUsd(parseFloat(formatEther(sellPrice ?? BigInt(0))))} (${formatEther(sellPrice ?? BigInt(0))} ETH)`
              }
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handlePlaceTrade} disabled={isBuying || isPriceLoading || isSelling || isSellPriceLoading}>
            {isBuying ? 'Buying...' : isSelling ? 'Selling...' : currentAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};