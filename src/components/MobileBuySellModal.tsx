import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, useSellShares, useSellPrice } from '../hooks/contract';
import { useAddress, useBalance } from '../hooks/user';
import { formatEther } from 'viem';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { Link } from 'react-router-dom';
import { useFundWallet, usePrivy } from '@privy-io/react-auth';
import { FaMinus, FaPlus, FaDollarSign, FaBackspace, FaWallet } from 'react-icons/fa';
import { formatNumber, formatEther as formatEther2 } from '../lib/utils';
import { currentChain } from '../main';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './ui/use-toast';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const formatTime = (timestamp: number) => format(new Date(timestamp), 'HH:mm:ss')


interface MobileBuySellModalProps {
  show: boolean;
  handleClose: () => void;
  handleOpen: (action: string, characterId: number, characterName: string) => void;
  actionType: 'Buy' | 'Sell';
  characterName: string;
  characterId: number;
  isInBattle: boolean;
  matchesLeft?: number;
  timeLeft?: number;
}

const NumberKey: React.FC<{ value: string; onClick: () => void }> = ({ value, onClick }) => (
  <button
    onClick={onClick}
    className="aspect-square bg-white active:bg-gray-100 border border-gray-200 rounded-lg 
               text-[4.5vw] sm:text-lg font-semibold text-gray-900 transition-colors
               flex items-center justify-center"
  >
    {value}
  </button>
);

export const MobileBuySellModal: React.FC<MobileBuySellModalProps> = ({
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
  const [amount, setAmount] = useState('0');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [buyError, setBuyError] = useState<any>(null);
  const [sellError, setSellError] = useState<any>(null);
  const [buySuccess, setBuySuccess] = useState<boolean>(false);
  const [sellSuccess, setSellSuccess] = useState<boolean>(false);
  
  const { toast } = useToast();
  const address = useAddress();
  const convertEthToUsd = useConvertEthToUsd();
  const { fundWallet } = useFundWallet();

  // Contract hooks
  const { data: buyPrice, rawData: buyPriceRaw } = useBuyPrice(characterId, BigInt(amount ?? 0) as any);
  const { data: sellPrice } = useSellPrice(characterId, BigInt(amount ?? 0) as any);
  const { buyShares, isPending: isBuying, isSuccess: buySharesSuccess, error: buySharesError } = useBuyShares(characterId, BigInt(amount ?? 0) as any, buyPriceRaw);
  const { sellShares, isPending: isSelling, isSuccess: sellSharesSuccess, error: sellSharesError } = useSellShares(characterId, BigInt(amount ?? 0) as any);
  const userBalance = useBalance(address as `0x${string}`);
  const { data: yourShares } = useCharacterSharesBalance(characterId ?? 0, address);

  const incrementAmount = () => {
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    setAmount((prev) => (prev === '' ? '1' : (parseInt(prev) + 1).toString()));
  };

  const decrementAmount = () => {
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    const newAmount = parseInt(amount) - 1;
    setAmount(newAmount >= 0 ? newAmount.toString() : '0');
  };

  const handleNumberPress = (num: string) => {
    setBuyError(null);
    setSellError(null);
    setBuySuccess(false);
    setSellSuccess(false);
    if (amount === '0') {
      setAmount(num);
    } else {
      setAmount(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

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
    if (dragOffset > 100) {
      handleClose();
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  // Calculate costs/proceeds
  const totalCost = parseFloat(formatEther(buyPriceRaw ?? BigInt(0)));
  const feeAmount = totalCost * 0.02;
  const baseCost = totalCost - feeAmount;

  const finalSellPrice = sellPrice;
  const totalProceeds = finalSellPrice / 0.98;
  const feeProceeds = totalProceeds * 0.02;

  useEffect(() => {
    if (buySharesError) setBuyError(buySharesError);
    if (sellSharesError) setSellError(sellSharesError);
    if (buySharesSuccess) setBuySuccess(true);
    if (sellSharesSuccess) setSellSuccess(true);
    if(buySharesSuccess || sellSharesSuccess || buyError || sellError) {
      const tempAmount = amount;
      setAmount('0');
      setTimeout(() => setAmount(tempAmount), 10);
    }
  }, [buySharesError, sellSharesError, buySharesSuccess, sellSharesSuccess]);

  // Add this effect to handle scroll locking
  useEffect(() => {
    if (show) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Cleanup function to restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [show]);


  // Then calculate the ETH amount
  const ethAmount = parseFloat(userBalance?.balance ?? '0') ?? 0

  if(!show) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999999]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={handleClose}
      />
      {/* Content */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: dragOffset }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl h-screen flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full pb-[env(safe-area-inset-bottom,16px)]">
          {/* Drag Handle and Close Button */}
          <div className="w-full flex justify-between items-center px-4 py-2 flex-shrink-0 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-1 bg-muted rounded-full" />
            </div>
            <div className="w-8" /> {/* Spacer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Header - flex-shrink-0 to maintain size */}
          <div className="px-4 mb-3 flex-shrink-0">
            <h2 className="text-2xl font-bold text-foreground">
              {actionType} {characterName}
            </h2>
            <p className="text-sm text-muted-foreground">
              You own: {yourShares} shares
            </p>
          </div>

          {/* Amount Display - flex-shrink-0 to maintain size */}
          <div className="px-4 mb-4 flex-shrink-0">
            <div className="bg-muted/50 py-3 px-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementAmount}
                  className="h-8 w-8 rounded-lg border-border bg-background text-foreground"
                >
                  <FaMinus className="h-3 w-3" />
                </Button>
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">{amount}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementAmount}
                  className="h-8 w-8 rounded-lg border-border bg-background text-foreground"
                >
                  <FaPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Numpad Container - flex-grow-1 to take remaining space */}
          <div className="flex-grow flex flex-col px-4">
            {/* Grid container with full height */}
            <div className="grid grid-cols-3 grid-rows-4 gap-1.5 h-full mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberPress(num)}
                  className="bg-background active:bg-muted 
                           text-3xl font-extrabold text-foreground 
                           transition-colors flex items-center justify-center
                           w-full h-full rounded-lg"
                >
                  {num}
                </button>
              ))}
              <button
                className="bg-background active:bg-muted 
                         text-3xl font-extrabold text-foreground 
                         transition-colors flex items-center justify-center
                         w-full h-full rounded-lg"
              >
                 
              </button>
              <button
                onClick={() => handleNumberPress('0')}
                className="bg-background active:bg-muted 
                         text-3xl font-extrabold text-foreground 
                         transition-colors flex items-center justify-center
                         w-full h-full rounded-lg"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="bg-muted/50 active:bg-muted 
                         text-3xl font-extrabold text-foreground 
                         transition-colors flex items-center justify-center
                         w-full h-full rounded-lg"
              >
                <FaBackspace className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Button and Price Info - flex-shrink-0 to maintain size */}
          <div className="pt-3 bg-background border-t border-border px-4 flex-shrink-0">
            <Button 
              className={`
                w-full h-12 rounded-xl font-bold text-white text-base relative overflow-hidden group
                ${isInBattle ? 'bg-gray-700 text-yellow-400 cursor-not-allowed' : 
                  actionType === 'Buy' 
                    ? 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
                    : 'bg-red-500 hover:bg-red-600'
                }
              `}
              onClick={actionType === 'Buy' ? buyShares : sellShares}
              disabled={isBuying || isSelling || isInBattle}
            >
              {isInBattle ? (
                "Trading locked 🔒"
              ) : (
                <>
                  <span className="relative z-10">
                    {isBuying ? 'BUYING...' : 
                     isSelling ? 'SELLING...' : 
                     actionType === 'Buy' ? 'BUY NOW' : 'SELL'}
                  </span>
                  {timeLeft > 0 && (
                    <span className="absolute top-0 right-0 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[8px] rounded-bl-md font-bold 
                      flex items-center text-white whitespace-nowrap"
                    >
                      <Clock className={`mr-0.5 h-2.5 w-2.5 animate-pulse ${actionType === 'Buy' ? 'text-green-300' : 'text-red-300'}`} />
                      {formatTime(timeLeft)}
                    </span>
                  )}
                </>
              )}
            </Button>

            {/* Price info or results - Fixed height container */}
            <div className="h-[88px] mb-4 px-4">
              {(buySuccess || sellSuccess || buyError || sellError) ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground/90">
                  {buySuccess && `✓ Bought ${amount} shares`}
                  {sellSuccess && `✓ Sold ${amount} shares`}
                  {(buyError || sellError) && (
                    <span className="text-red-400">
                      {(buyError || sellError)?.message}
                    </span>
                  )}
                </div>
              ) : amount !== '0' ? (
                <div className="h-full flex flex-col justify-center gap-2">
                  {/* Wallet Balance */}
                  <div className="flex items-center justify-start">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                      <FaWallet className="h-3 w-3" />
                      <span>
                        {formatNumber(convertEthToUsd(ethAmount))}
                        <span className="text-xs ml-1">
                          ({ethAmount.toFixed(4)} ETH)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        {actionType === 'Buy' ? 'COST' : 'PRICE'}
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(convertEthToUsd(actionType === 'Buy' ? baseCost : totalProceeds))}
                      </span>
                    </div>

                    <span className="text-sm text-muted-foreground/50 font-light mx-1">
                      {actionType === 'Buy' ? '+' : '-'}
                    </span>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        FEE
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(convertEthToUsd(actionType === 'Buy' ? feeAmount : feeProceeds))}
                      </span>
                    </div>

                    <span className="text-sm text-muted-foreground/50 font-light mx-1">
                      =
                    </span>

                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        TOTAL
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(convertEthToUsd(actionType === 'Buy' ? totalCost : finalSellPrice))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full" />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  , document.body);
}; 