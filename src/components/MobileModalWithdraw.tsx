import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useWithdraw } from '../hooks/user';
import { isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ArrowUpRight, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAddress, useBalance } from '../hooks/user';
import { useConvertEthToUsd } from '../EthPriceProvider';
import { formatNumber, formatEther } from '../lib/utils';
import { usePrivy } from '@privy-io/react-auth';

interface MobileModalWithdrawProps {
  show: boolean;
  handleClose: () => void;
}

export const MobileModalWithdraw: React.FC<MobileModalWithdrawProps> = ({
  show,
  handleClose,
}) => {
  const [amount, setAmount] = useState<number | string>('');
  const [walletAddress, setWalletAddress] = useState<`0x${string}` | string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [addressError, setAddressError] = useState('');
  const [amountError, setAmountError] = useState('');

  const { 
    withdraw, 
    isPending, 
    error, 
    isSuccess 
  } = useWithdraw();

  const address = useAddress();
  const { exportWallet } = usePrivy();
  const { balance: userBalance } = useBalance(address as `0x${string}`);
  const convertEthToUsd = useConvertEthToUsd();

  // Validate address
  const validateAddress = (address: string) => {
    if (!address) {
      setAddressError('Wallet address is required');
      return false;
    }
    if (!isAddress(address)) {
      setAddressError('Invalid Ethereum address');
      return false;
    }
    setAddressError('');
    return true;
  };

  // Validate amount
  const validateAmount = (value: string | number) => {
    const numValue = Number(value);
    if (!value) {
      setAmountError('Amount is required');
      return false;
    }
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (numValue > Number(userBalance)) {
      setAmountError('Amount exceeds balance');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleWithdraw = useCallback(() => {
    const isAddressValid = validateAddress(walletAddress);
    const isAmountValid = validateAmount(amount);

    if (!isAddressValid || !isAmountValid) {
      return;
    }

    withdraw(walletAddress as `0x${string}`, Number(amount));
  }, [withdraw, walletAddress, amount]);

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

  const handleExportWallet = () => {
    exportWallet();
  };

  useEffect(() => {
    if (show) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40"
            onClick={handleClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: dragOffset }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-[60] h-[95vh] flex flex-col"
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

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold">Withdraw Funds</h2>
                  <p className="text-muted-foreground mt-1">
                    Withdraw your funds to any wallet
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="bg-muted/50 p-4 rounded-xl space-y-1">
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-xl font-bold">
                      {formatNumber(convertEthToUsd(parseFloat(userBalance ?? "0")) ?? 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatEther(parseFloat(userBalance ?? "0"))} ETH
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Wallet Address
                    </Label>
                    <Input
                      value={walletAddress}
                      onChange={(e) => {
                        setWalletAddress(e.target.value);
                        if (addressError) validateAddress(e.target.value);
                      }}
                      placeholder="0x..."
                      className={cn(
                        "h-12 rounded-xl bg-muted/50 border-2 transition-colors",
                        addressError ? "border-red-500/50 focus:border-red-500" : "border-transparent focus:border-primary"
                      )}
                    />
                    {addressError && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        <span>{addressError}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Amount (In ETH)
                    </Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (amountError) validateAmount(e.target.value);
                      }}
                      placeholder="0.00"
                      min="0"
                      step="any"
                      className={cn(
                        "h-12 rounded-xl bg-muted/50 border-2 transition-colors",
                        amountError ? "border-red-500/50 focus:border-red-500" : "border-transparent focus:border-primary"
                      )}
                    />
                    {amountError && (
                      <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        <span>{amountError}</span>
                      </div>
                    )}
                  </div>

                  {/* Withdraw Button */}
                  <Button
                    onClick={handleWithdraw}
                    disabled={isPending || !!addressError || !!amountError}
                    className={cn(
                      "w-full h-14 rounded-xl text-white font-bold",
                      "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {isPending ? (
                      'Withdrawing...'
                    ) : (
                      <>
                        Withdraw
                        <ArrowUpRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {/* Export Wallet Button */}
                  <Button
                    variant="outline"
                    onClick={handleExportWallet}
                    className="w-full h-12 rounded-xl border-2 flex items-center justify-center gap-2 text-base"
                  >
                    <Wallet className="h-4 w-4" />
                    Export Wallet
                  </Button>
                </div>

                {/* Move error/success messages after buttons */}
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error.message}</span>
                  </div>
                )}
                {isSuccess && (
                  <div className="text-green-500 text-sm text-center bg-green-500/10 p-3 rounded-lg mt-4">
                    Withdrawal successful!
                  </div>
                )}
              </div>

              {/* Remove the bottom action button section since we moved it up */}
              <div className="h-[env(safe-area-inset-bottom,16px)]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 