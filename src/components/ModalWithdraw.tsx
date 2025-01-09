import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useWithdraw } from '../hooks/user';
import { isAddress } from 'viem';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DefaultModal } from './Modal';

export const ModalWithdraw = ({ show, handleClose }: { show: boolean, handleClose: () => void }) => {
    const [amount, setAmount] = useState<number | string>(0);
    const [walletAddress, setWalletAddress] = useState<`0x${string}` | any>("");
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isMouseOver, setIsMouseOver] = useState(false);

    const { 
        withdraw, 
        isPending, 
        error, 
        isSuccess 
    } = useWithdraw();

    const isMobile = useMediaQuery('(max-width: 1100px)');

    useEffect(() => {
        if (show && isMobile) {
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
    }, [show, isMobile]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
    };

    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWalletAddress(e.target.value);
    };

    const handleWithdraw = useCallback(() => {
        if (
            walletAddress === "" || 
            amount === 0 || 
            amount === undefined  || 
            amount == '' ||
            isAddress(walletAddress) === false
        ) {
            return;
        }
        withdraw(walletAddress as `0x{string}`, amount as number);
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
        if (dragOffset > 200) { // Threshold to close
            handleClose();
        }
        setIsDragging(false);
        setDragOffset(0);
    };

    if (!isMobile) {
        return (
            <DefaultModal
                show={show}
                handleClose={handleClose}
                title="Withdraw Fund"
            >
                <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-1">
                        <Label>Wallet Address</Label>
                        <Input
                            type="text"
                            value={walletAddress}
                            onChange={handleWalletAddressChange}
                            placeholder="Enter wallet address"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                        />
                    </div>
                    <Button 
                        className="w-full"
                        onClick={handleWithdraw}
                        disabled={isPending}
                    >
                        {isPending ? 'Withdrawing...' : 'Withdraw'}
                    </Button>
                    <div className="text-center">
                        {error && <p className="text-red-500 text-sm">{error.message}</p>}
                        {isSuccess && <p className="text-green-500 text-sm">Withdrawal successful!</p>}
                    </div>
                </div>
            </DefaultModal>
        );
    }

    return (
        <Dialog open={show} onOpenChange={handleClose}>
            <DialogContent
                onMouseEnter={() => setIsMouseOver(true)}
                onMouseLeave={() => setIsMouseOver(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="fixed !bottom-0 !translate-y-0 !translate-x-0 !top-auto !left-0
                          w-full !max-w-full rounded-t-3xl bg-white
                          h-[80vh] flex flex-col p-4 pb-8 transition-transform shadow-2xl"
                style={{
                    transform: `translateY(${dragOffset}px)`,
                    margin: 0,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                }}
            >
                <div className="w-full flex justify-center mb-4">
                    <div className="w-16 h-1 bg-gray-200 rounded-full" />
                </div>

                <DialogHeader className="mb-6 text-center">
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                        Withdraw Funds
                    </DialogTitle>
                    <DialogDescription className="text-lg mt-1 text-gray-500">
                        Withdraw your funds to any wallet
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-gray-700">
                                Wallet Address
                            </Label>
                            <Input
                                value={walletAddress}
                                onChange={handleWalletAddressChange}
                                placeholder="Enter wallet address"
                                className="h-12 rounded-xl bg-white text-gray-900 border-gray-200"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-gray-700">
                                Amount
                            </Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={handleAmountChange}
                                className="h-12 rounded-xl bg-white text-gray-900 border-gray-200"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center">
                                {error.message}
                            </div>
                        )}
                        {isSuccess && (
                            <div className="text-green-500 text-sm text-center">
                                Withdrawal successful!
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto pt-6">
                    <DialogFooter>
                        <Button
                            onClick={handleWithdraw}
                            disabled={isPending}
                            className="w-full h-12 rounded-xl text-white shadow-lg
                                     bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                        >
                            {isPending ? 'Withdrawing...' : 'Withdraw'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
