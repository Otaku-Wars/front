import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, useSellShares, useSellPrice } from '../hooks/contract';
import { useAddress, useBalance } from '../hooks/user';
import {  formatEther } from 'viem';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { Link } from 'react-router-dom';
import { useFundWallet, usePrivy } from '@privy-io/react-auth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { FaMinus } from 'react-icons/fa';
import { FaPlus } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa';
import { FaWallet } from 'react-icons/fa';
import { FaArrowDown } from 'react-icons/fa';
import { formatNumber, formatEther as formatEther2 } from '../lib/utils';
import { currentChain } from '../main';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Clock } from 'lucide-react';
import { Status } from '@memeclashtv/types';

interface ModalBuySellProps {
  show: boolean;
  handleClose: () => void;
  handleOpen: (action:string, characterId: number, characterName: string) => void;
  actionType: 'Buy' | 'Sell';
  characterName: string;
  characterId: number;
  isInBattle: boolean;
  matchesLeft?: number;
  timeLeft?: number;
}

export const ModalBuySell: React.FC<ModalBuySellProps> = ({ 
  show, 
  handleClose, 
  handleOpen,
  actionType, 
  characterName, 
  characterId,
  isInBattle,
  matchesLeft,
  timeLeft,
}) => {
  const { ready } = usePrivy();
  const { fundWallet } = useFundWallet()
  console.log('mounted ModalBuySell with show:', show);
  const [internalShow, setInternalShow] = useState(show);
  const [amount, setAmount] = useState<any>('0');
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
    // Allow only empty string or digits
    try {
      if (value === '' || /^[0-9]+$/.test(value)) {
        setAmount(value); // Set amount directly to the input value
        // Reset error and success states
        setBuyError(null);
        setSellError(null);
        setBuySuccess(false);
        setSellSuccess(false);
      }
    } catch (error) {
      console.error("Error parsing amount:", error);
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
      handleOpen(actionType, characterId, characterName);
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


  const shouldFundOnBuyAmount = useMemo(() => {
    const balance = parseFloat(userBalance?.balance ?? '0') ?? 0;
    console.log("shouldFundOnBuyAmount", totalCost, balance)
    return Math.max(0, totalCost - balance);
  }, [userBalance, totalCost]);

  const handlePlaceTrade =  useCallback(() => {
    console.log("handlePlaceTrade", shouldFundOnBuyAmount, currentAction)
    if(shouldFundOnBuyAmount > 0 && currentAction === 'Buy') {
      fundWallet(address, {chain: currentChain, amount: shouldFundOnBuyAmount.toString()});
      return;
    }
    if (currentAction === 'Buy') {
      console.log(`Attempting to buy ${amount} shares with ${ethAmount} ETH`);
      buyShares();
    } else {
      sellShares();
    }
  }, [shouldFundOnBuyAmount, currentAction, buyShares, sellShares, address, fundWallet]);

  const isMobile = useMediaQuery('(max-width: 1100px)');

  useEffect(() => {
    if (internalShow && isMobile) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [internalShow, isMobile]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const offset = Math.max(0, currentY - dragStartY);
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 200) { // Threshold to close
      trueClose();
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <Dialog 
      open={internalShow} 
      onOpenChange={trueClose}
    >
      <DialogContent 
        onMouseEnter={() => setIsMouseOver(true)} 
        onMouseLeave={() => setIsMouseOver(false)}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        className={`
          ${isMobile ? 'fixed !bottom-0 !translate-y-0 !translate-x-0 !top-auto !left-0' : ''}
          ${isMobile ? 'w-full !max-w-full rounded-t-3xl bg-white' : 'bg-gray-900'}
          ${isMobile ? 'min-h-[95vh] max-h-[95vh]' : ''}
          ${isMobile ? 'flex flex-col p-4 pb-8' : 'p-8'}
          ${isMobile ? 'transition-transform shadow-2xl' : ''}
        `}
        style={{
          transform: isMobile ? `translateY(${dragOffset}px)` : undefined,
          margin: isMobile ? 0 : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {isMobile && (
          <div className="w-full flex justify-center mb-4 flex-shrink-0">
            <div className="w-16 h-1 bg-gray-200 rounded-full" />
          </div>
        )}
        <div className="flex flex-col h-full min-h-0 relative pb-[80px]">
          <DialogHeader className={`flex-shrink-0 ${isMobile ? 'mb-6 text-center' : ''}`}>
            <DialogTitle className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>
              {currentAction} {characterName}
            </DialogTitle>
            <DialogDescription className={`text-lg mt-1 ${isMobile ? 'text-gray-500' : 'text-gray-400'}`}>
              You own: {yourShares} shares of {characterName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isMobile ? (
              // Mobile - Direct content without tabs
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">
                    Amount to {currentAction}
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={decrementAmount}
                      className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-10 w-10 rounded-xl"
                    >
                      <FaMinus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="amount"
                      value={amount}
                      onChange={handleAmountChange}
                      className="text-center text-lg font-semibold h-10 rounded-xl bg-white text-gray-900 border-gray-200"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={incrementAmount}
                      className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-10 w-10 rounded-xl"
                    >
                      <FaPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <Label className="text-sm font-semibold block text-gray-700">
                    {currentAction === 'Buy' ? 'Cost Breakdown' : 'Proceeds Breakdown'}
                  </Label>
                  <div className="space-y-2">
                    {currentAction === 'Buy' ? (
                      <>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-500">Base Cost:</span>
                          <span className="font-medium text-gray-900">
                            ${formatNumber(convertEthToUsd(baseCost))}
                          </span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-500">Fee (2%):</span>
                          <span className="font-medium text-gray-900">
                            ${formatNumber(convertEthToUsd(feeAmount))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-base font-semibold text-gray-700">
                            Total Cost:
                          </span>
                          <div className="flex items-center space-x-1">
                            <FaDollarSign className="h-5 w-5 text-gray-900" />
                            <span className="text-2xl font-bold text-gray-900">
                              {formatNumber(convertEthToUsd(totalCost))}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 text-right">≈ {formatEther2(totalCost)} ETH</p>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-500">Original Sell Price:</span>
                          <span className="font-medium text-gray-900">
                            ${formatNumber(convertEthToUsd(totalProceeds))}
                          </span>
                        </div>
                        <div className="flex justify-between text-base">
                          <span className="text-gray-500">Fee (2%):</span>
                          <span className="font-medium text-gray-900">
                            -${formatNumber(convertEthToUsd(feeProceeds))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-base font-semibold text-gray-700">
                            Total Proceeds:
                          </span>
                          <div className="flex items-center space-x-1">
                            <FaDollarSign className="h-5 w-5 text-gray-900" />
                            <span className="text-2xl font-bold text-gray-900">
                              {formatNumber(convertEthToUsd(finalSellPrice))}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 text-right">≈ {formatEther2(finalSellPrice)} ETH</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Desktop - Keep existing tabs implementation
              <Tabs value={currentAction} onValueChange={(value) => setCurrentAction(value as 'Buy' | 'Sell')} className="w-full">
                <TabsList className={`
                  grid w-full grid-cols-2 
                  ${isMobile ? 'bg-gray-100 p-1.5 rounded-xl mb-4 h-[45px]' : 'bg-gray-800'}
                `}>
                  <TabsTrigger 
                    value="Buy" 
                    className={`
                      ${isMobile ? 'data-[state=active]:bg-white text-gray-700' : 'data-[state=active]:bg-gray-700 text-white'}
                      ${isMobile ? 'h-full text-lg font-semibold rounded-lg' : ''}
                      ${isMobile ? 'data-[state=active]:shadow-sm' : ''}
                      transition-all duration-200
                      relative
                      overflow-hidden
                    `}
                  >
                    Buy
                  </TabsTrigger>
                  <TabsTrigger 
                    value="Sell" 
                    className={`
                      ${isMobile ? 'data-[state=active]:bg-white text-gray-700' : 'data-[state=active]:bg-gray-700 text-white'}
                      ${isMobile ? 'h-full text-lg font-semibold rounded-lg' : ''}
                      ${isMobile ? 'data-[state=active]:shadow-sm' : ''}
                      transition-all duration-200
                      relative
                      overflow-hidden
                    `}
                  >
                    Sell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="Buy" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className={`
                      text-sm font-semibold
                      ${isMobile ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      Amount to Buy
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementAmount}
                        className={`
                          ${isMobile ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
                          h-10 w-10 rounded-xl
                        `}
                      >
                        <FaMinus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`
                          text-center text-lg font-semibold h-10 rounded-xl
                          ${isMobile ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white'}
                        `}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementAmount}
                        className={`
                          ${isMobile ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
                          h-10 w-10 rounded-xl
                        `}
                      >
                        <FaPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={`
                    space-y-3 
                    ${isMobile ? 'bg-gray-50 p-4 rounded-2xl border border-gray-100' : ''}
                  `}>
                    <Label className={`
                      text-sm font-semibold block
                      ${isMobile ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      Cost Breakdown
                    </Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-base">
                        <span className={`${isMobile ? 'text-gray-500' : 'text-gray-400'}`}>Base Cost:</span>
                        <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                          ${formatNumber(convertEthToUsd(baseCost))}
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className={`${isMobile ? 'text-gray-500' : 'text-gray-400'}`}>Fee (2%):</span>
                        <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                          ${formatNumber(convertEthToUsd(feeAmount))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <span className={`text-base font-semibold ${isMobile ? 'text-gray-700' : 'text-gray-300'}`}>
                          Total Cost:
                        </span>
                        <div className="flex items-center space-x-1">
                          <FaDollarSign className={`h-5 w-5 ${isMobile ? 'text-gray-900' : 'text-white'}`} />
                          <span className={`text-2xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                            {formatNumber(convertEthToUsd(totalCost))}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 text-right">≈ {formatEther2(totalCost)} ETH</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="Sell" className="space-y-6 mt-2">
                  <div className="space-y-3">
                    <Label htmlFor="amount" className={`
                      text-base font-semibold
                      ${isMobile ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      Amount to Sell
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementAmount}
                        className={`
                          ${isMobile ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
                          h-12 w-12 rounded-xl
                        `}
                      >
                        <FaMinus className="h-5 w-5" />
                      </Button>
                      <Input
                        id="amount"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`
                          text-center text-xl font-semibold h-12 rounded-xl
                          ${isMobile ? 'bg-white text-gray-900 border-gray-200' : 'bg-gray-800 text-white'}
                        `}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementAmount}
                        className={`
                          ${isMobile ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
                          h-12 w-12 rounded-xl
                        `}
                      >
                        <FaPlus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <div className={`
                    space-y-4 
                    ${isMobile ? 'bg-gray-50 p-5 rounded-2xl border border-gray-100' : ''}
                  `}>
                    <Label className={`
                      text-base font-semibold block
                      ${isMobile ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      Proceeds Breakdown
                    </Label>
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className={`${isMobile ? 'text-gray-500' : 'text-gray-400'}`}>Original Sell Price:</span>
                        <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                          ${formatNumber(convertEthToUsd(totalProceeds))}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className={`${isMobile ? 'text-gray-500' : 'text-gray-400'}`}>Fee (2%):</span>
                        <span className={`font-medium ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                          -${formatNumber(convertEthToUsd(feeProceeds))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className={`text-lg font-semibold ${isMobile ? 'text-gray-700' : 'text-gray-300'}`}>
                          Total Proceeds:
                        </span>
                        <div className="flex items-center space-x-2">
                          <FaDollarSign className={`h-6 w-6 ${isMobile ? 'text-gray-900' : 'text-white'}`} />
                          <span className={`text-3xl font-bold ${isMobile ? 'text-gray-900' : 'text-white'}`}>
                            {formatNumber(convertEthToUsd(finalSellPrice))}
                          </span>
                        </div>
                      </div>
                      <p className="text-md text-gray-500 text-right">≈ {formatEther2(finalSellPrice)} ETH</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className={`
            ${isMobile ? 'p-4 bg-white border-t border-gray-100' : 'p-3 bg-gray-900'}
          `}>
            <div className="flex flex-col gap-3">
              <div className={`
                ${(buySuccess || sellSuccess || buyError || sellError) ? 'block' : 'hidden'}
                max-h-[80px] overflow-y-auto
              `}>
                <div className={`
                  ${isMobile 
                    ? 'bg-gray-50 border border-gray-100 rounded-xl p-4' 
                    : 'bg-gray-800 rounded-lg p-4'
                  }
                  max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                `}>
                  {buySuccess && currentAction === 'Buy' && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-green-600' : 'text-green-400'}`}>
                      <div className="flex-1">
                        Successfully bought {amount} shares! 
                        <Link to={`/user/${address}`} className="underline ml-1">
                          Check balance
                        </Link>
                      </div>
                    </div>
                  )}
                  {sellSuccess && currentAction === 'Sell' && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-green-600' : 'text-green-400'}`}>
                      <div className="flex-1">
                        Successfully sold {amount} shares! 
                        <Link to={`/user/${address}`} className="underline ml-1">
                          Check balance
                        </Link>
                      </div>
                    </div>
                  )}
                  {buyError && currentAction === 'Buy' && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-red-600' : 'text-red-400'} break-words`}>
                      <div className="flex-1 text-sm">
                        Error: {buyError.message}
                      </div>
                    </div>
                  )}
                  {sellError && currentAction === 'Sell' && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-red-600' : 'text-red-400'} break-words`}>
                      <div className="flex-1 text-sm">
                        Error: {sellError.message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                type="submit" 
                className={`
                  w-full h-12 relative overflow-hidden group
                  ${isInBattle ? 'bg-gray-700 text-yellow-400 cursor-not-allowed' : ''}
                  ${isMobile ? (
                    // Mobile styles remain the same
                    currentAction === 'Buy' 
                      ? `bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700
                         animate-aggressive-pulse transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]
                         hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] focus:shadow-[0_0_20px_rgba(34,197,94,0.3)]`
                      : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                  ) : (
                    // Web app styles
                    currentAction === 'Buy' 
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  )}
                  ${isMobile ? 'rounded-xl text-white shadow-lg' : 'text-white'}
                `}
                onClick={handlePlaceTrade}
                disabled={isBuying || isSelling || isInBattle}
              >
                {isInBattle ? (
                  "Trading locked 🔒"
                ) : (
                  <>
                    <span className={`
                      relative z-10
                      ${isMobile ? (
                        `text-shadow-glow animate-text-pulse 
                        ${currentAction === 'Buy' ? 'text-outline outline-black text-black group-hover:animate-shimmer-text' : 'text-white'}
                        text-sm font-bold uppercase tracking-wider`
                      ) : (
                        'text-white font-semibold'
                      )}
                    `}>
                      {isBuying ? 'BUYING...' : 
                       isSelling ? 'SELLING...' : 
                       currentAction === 'Buy' ? 'BUY NOW' : 'SELL'}
                    </span>
                    {isMobile && currentAction === 'Buy' && (
                      <span 
                        className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-300 to-green-400 opacity-75 
                          animate-shimmer group-hover:opacity-90" 
                        style={{ backgroundSize: '200% 100%' }}
                      />
                    )}
                    <span className="absolute top-0 right-0 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[8px] rounded-bl-md font-bold 
                      flex items-center text-white whitespace-nowrap group-hover:bg-black/50"
                    >
                      <Clock className={`mr-0.5 h-2.5 w-2.5 animate-pulse ${currentAction === 'Buy' ? 'text-green-300' : 'text-red-300'}`} />
                      {timeLeft > 0
                        ? `${formatTime(timeLeft)} left`
                        : matchesLeft <= 0 
                          ? 'Finished'
                          : matchesLeft === 1
                            ? 'Next up'
                            : `${matchesLeft} matches left`
                      }
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function parseEther(arg0: string) {
  throw new Error('Function not implemented.');
}