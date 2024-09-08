import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, useSellShares, useSellPrice } from '../hooks/contract';
import { useAddress, useBalance } from '../hooks/user';
import { parseEther, formatEther } from 'viem';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { Link } from 'react-router-dom';

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
  const [amount, setAmount] = useState<any>(0);
  const [buyError, setBuyError] = useState<any>(null);
  const [sellError, setSellError] = useState<any>(null);
  const [buySuccess, setBuySuccess] = useState<boolean>(false);
  const [sellSuccess, setSellSuccess] = useState<boolean>(false);

  const address = useAddress();
  const [currentAction, setCurrentAction] = useState(actionType);
  const convertEthToUsd = useConvertEthToUsd();

  const { 
    data: buyPrice, 
    rawData: buyPriceRaw,
    isPending: isPriceLoading, 
    error: priceError 
  } = useBuyPrice(characterId, BigInt(amount ?? 0) as any);

  const {
    data: sellPrice,
    isPending: isSellPriceLoading,
    error: sellPriceError
  } = useSellPrice(characterId, BigInt(amount ?? 0) as any);

  const ethAmount = buyPrice ? parseEther(buyPrice.toString()) : BigInt(0);

  const { 
    buyShares, 
    isPending: isBuying, 
    error: buySharesError, 
    isSuccess: buySharesSuccess 
  } = useBuyShares(characterId, BigInt(amount ?? 0) as any, buyPriceRaw);

  const userBalance = useBalance(address as `0x${string}`);

  const { 
    sellShares, 
    isPending: isSelling, 
    error: sellSharesError, 
    isSuccess: sellSharesSuccess 
  } = useSellShares(characterId, BigInt(amount ?? 0) as any);

  const {data: yourShares} = useCharacterSharesBalance(characterId ?? 0, address);

  useEffect(() => {
    setCurrentAction(actionType);
  }, [actionType]);

  useEffect(() => {
    if (buySharesError) setBuyError(buySharesError);
    if (sellSharesError) setSellError(sellSharesError);
    if (buySharesSuccess) setBuySuccess(true);
    if (sellSharesSuccess) setSellSuccess(true);
    if(buySharesSuccess || sellSharesSuccess || buyError || sellError) {
      const tempAmount = amount;
      setAmount(0);
      setTimeout(() => setAmount(tempAmount), 10);
    }
  }, [buySharesError, sellSharesError, buySharesSuccess, sellSharesSuccess]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid number
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value); // Set amount directly to the input value
      // Reset error and success states
      setBuyError(null);
      setSellError(null);
      setBuySuccess(false);
      setSellSuccess(false);
    }
  };

  const handlePlaceTrade = () => {
    if (currentAction === 'Buy') {
      console.log(`Attempting to buy ${amount} shares with ${ethAmount} ETH`);
      buyShares();
    } else {
      sellShares();
    }
  };

  const incrementAmount = () => {
    // Reset error and success states
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    setAmount((prev) => (prev === '' ? '1' : (parseInt(prev) + 1).toString()));
  }
  const decrementAmount = () => {
    // Reset error and success states
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    const newAmount = parseInt(amount) - 1;
    setAmount(newAmount >= 0 ? newAmount.toString() : '0'); // Prevent negative values
  };

  const trueClose = () => {
    // Reset error and success states
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    handleClose();
  }

  return (
    <Dialog open={show} onOpenChange={trueClose}>
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
                type="text"
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
              ${convertEthToUsd(parseFloat(formatEther(userBalance?.balance ?? BigInt(0) as any) as any))} ({formatEther(userBalance?.balance ?? BigInt(0) as any)} ETH)
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Est. Cost</Label>
            <div className="col-span-3">
              {isPriceLoading || isSellPriceLoading ? 
                'Loading...' : 
                currentAction === 'Buy' ?
                  `$${convertEthToUsd(buyPrice ?? 0)} (${buyPrice} ETH)` :
                  `$${convertEthToUsd(sellPrice ?? 0)} (${sellPrice} ETH)`
              }
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
          {buyError && currentAction === 'Buy' && (
            <div className="text-red-500 col-span-4">
              Error: {buyError.message}
            </div>
          )}
          {sellError && currentAction === 'Sell' && (
            <div className="text-red-500 col-span-4">
              Error: {sellError.message}
            </div>
          )}
          {buySuccess && currentAction === 'Buy' && (
            <div className="text-green-500 col-span-4">
              Successfully bought {amount} shares! <span className="text-blue-500 underline"><Link to={`/user/${address}`}>Check balance</Link></span>
            </div>
          )}
          {sellSuccess && currentAction === 'Sell' && (
            <div className="text-green-500 col-span-4">
              Successfully sold {amount} shares! <span className="text-blue-500 underline"><Link to={`/user/${address}`}>Check balance</Link></span>
            </div>
          )}
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