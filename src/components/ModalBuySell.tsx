import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, useSellShares, useSellPrice } from '../hooks/contract';
import { useAddress, useBalance } from '../hooks/user';
import {  formatEther } from 'viem';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { Link } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { FaMinus } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa';
import { FaWallet } from 'react-icons/fa';
import { FaArrowDown } from 'react-icons/fa';
import { formatNumber, formatEther as formatEther2 } from '../lib/utils';

interface ModalBuySellProps {
  show: boolean;
  handleClose: () => void;
  handleOpen: (action:string) => void;
  actionType: 'Buy' | 'Sell';
  characterName: string;
  characterId: number;
  isInBattle: boolean;
}

export const ModalBuySell: React.FC<ModalBuySellProps> = ({ 
  show, 
  handleClose, 
  handleOpen,
  actionType, 
  characterName, 
  characterId,
  isInBattle,
}) => {
  const { ready } = usePrivy();
  console.log('mounted ModalBuySell with show:', show);
  const [internalShow, setInternalShow] = useState(show);
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

  const ethAmount = buyPriceRaw ? formatEther(buyPriceRaw) : 0;

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

  const [isMouseOver, setIsMouseOver] = useState(false);

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

  useEffect(() => {
    if (ready && show) {
      setInternalShow(show);
    }
  }, [show, ready]);

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
    console.log("mounted Calling true close")
    if (isMouseOver) {
      setInternalShow(false);
      handleClose();
    }else{
      handleOpen(actionType);
    }
  }

  //    //if sell amount is greater than balance then set amount to balance
  useEffect(() => {
    if (currentAction === 'Sell' && yourShares && parseInt(amount) > yourShares) {
      setAmount(yourShares.toString());
    }
  }, [yourShares, amount, currentAction]);

  const totalCost = parseFloat(formatEther(buyPriceRaw ?? BigInt(0)));
  const feeAmount = totalCost * 0.02;
  const baseCost = totalCost - feeAmount;


  //sell
  const finalSellPrice = sellPrice;
  //if the fee is 2% totalProceeds is 98% of the proceeds
  //lets find out what 100% of the proceeds is
  const totalProceeds = finalSellPrice / 0.98;
  const feeProceeds = totalProceeds * 0.02;

  return (
    <Dialog open={internalShow} onOpenChange={trueClose}>
      <DialogContent 
        onMouseEnter={() => setIsMouseOver(true)} 
        onMouseLeave={() => setIsMouseOver(false)}
        className="bg-gray-900"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Trade Shares</DialogTitle>
          <DialogDescription className="text-gray-400">
            You own: {yourShares} shares of {characterName}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={currentAction} onValueChange={(value) => setCurrentAction(value as 'Buy' | 'Sell')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="Buy" className="data-[state=active]:bg-gray-700 text-white">Buy</TabsTrigger>
            <TabsTrigger value="Sell" className="data-[state=active]:bg-gray-700 text-white">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="Buy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-300">
                Amount to Buy
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementAmount}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <FaMinus className="h-4 w-4" />
                </Button>
                <Input
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="text-center bg-gray-800 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementAmount}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <FaPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Cost Breakdown</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Base Cost:</span>
                  <span className="text-white">{formatNumber(convertEthToUsd(baseCost))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee (2%):</span>
                  <span className="text-white">{formatNumber(convertEthToUsd(feeAmount))}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <span className="text-sm font-medium text-gray-300">Total Cost:</span>
                <div className="flex items-center space-x-2 text-2xl font-bold text-white">
                  <FaDollarSign className="h-6 w-6" />
                  <span>{formatNumber(convertEthToUsd(totalCost))}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">≈ {formatEther2(totalCost)}</p>
            </div>
          </TabsContent>
          <TabsContent value="Sell" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-300">
                Amount to Sell
              </Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementAmount}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <FaMinus className="h-4 w-4" />
                </Button>
                <Input
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="text-center bg-gray-800 text-white"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementAmount}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <FaPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Proceeds Breakdown</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Original Sell Price:</span>
                  <span className="text-white">{formatNumber(convertEthToUsd(totalProceeds))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee (2%):</span>
                  <span className="text-white">-${formatNumber(convertEthToUsd(feeProceeds))}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <span className="text-sm font-medium text-gray-300">Total Proceeds:</span>
                <div className="flex items-center space-x-2 text-2xl font-bold text-white">
                  <FaDollarSign className="h-6 w-6" />
                  <span>{formatNumber(convertEthToUsd(finalSellPrice))}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">≈ {formatEther2(finalSellPrice)} ETH</p>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaWallet className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Balance: {formatEther2(parseFloat(userBalance?.balance))} ({formatNumber(convertEthToUsd(parseFloat(userBalance?.balance)))})</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaArrowDown className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">1 ETH = ${formatNumber(convertEthToUsd(1))}</span>
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            className={`w-full ${isInBattle ? 'bg-gray-500' : ''} ${currentAction === 'Buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} font-bold text-xl`} 
            onClick={handlePlaceTrade}
            disabled={isBuying || isSelling || isInBattle}
          >
            {isInBattle ? 'In Battle' : isBuying ? 'Buying...' : isSelling ? 'Selling...' : currentAction} 
            {isInBattle && <span className="text-sm text-red-500"> (Cannot buy or sell while in battle)</span>}
          </Button>
        </DialogFooter>
        <div className="mt-4 max-w-full overflow-hidden">
          <div className="max-h-32 overflow-y-auto p-4 bg-gray-800 rounded shadow-md">
            {buySuccess && currentAction === 'Buy' && (
              <div className="text-green-500">
                Successfully bought {amount} shares! <span className="text-green-500 underline"><Link to={`/user/${address}`}>Check balance</Link></span>
              </div>
            )}
            {sellSuccess && currentAction === 'Sell' && (
              <div className="text-green-500">
                Successfully sold {amount} shares! <span className="text-green-500 underline"><Link to={`/user/${address}`}>Check balance</Link></span>
              </div>
            )}
            {buyError && currentAction === 'Buy' && (
              <div className="text-red-500">
                Error: {buyError.message}
              </div>
            )}
            {sellError && currentAction === 'Sell' && (
              <div className="text-red-500">
                Error: {sellError.message}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function parseEther(arg0: string) {
  throw new Error('Function not implemented.');
}