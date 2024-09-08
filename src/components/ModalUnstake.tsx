import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUnstake, useCharacterSharesBalance } from '../hooks/contract';
import { useAddress } from '../hooks/user';
import { useTimeTill } from './WorldStateView';
import { Attribute } from '@memeclashtv/types';

interface ModalUnstakeProps {
    show: boolean;
    handleClose: () => void;
    characterId: number;
    attribute: number;
    stakeUnlockTime: number;
}

const ModalUnstake: React.FC<ModalUnstakeProps> = ({ show, handleClose, characterId, attribute, stakeUnlockTime }) => {
    const [unstakeAmount, setUnstakeAmount] = useState<any>(0);
    const address = useAddress();

    const { unstakeShares, isError, isSuccess, isPending, error } = useUnstake(characterId, attribute, BigInt(unstakeAmount) as any);
    const { data: yourShares } = useCharacterSharesBalance(characterId ?? 0, address);

    const handleUnstake = () => {
        console.log(`Unstaking ${unstakeAmount} for ${attribute} on character ${characterId}`);
        unstakeShares();
        setUnstakeAmount('' as any); // Reset to empty string
    };

    useEffect(() => {
        if (show) {
            setUnstakeAmount(0); // Reset amount when modal opens
        }
    }, [show]);

    useEffect(() => {
        if (isSuccess) {
            setUnstakeAmount(0);
        }
    }, [isSuccess]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setUnstakeAmount(value as any);
        }
    };

    const incrementAmount = () => {
        setUnstakeAmount((prev) => (prev === '' ? '1' : (parseInt(prev) + 1).toString()));
    };

    const decrementAmount = () => {
        const newAmount = parseInt(unstakeAmount) - 1;
        setUnstakeAmount(newAmount >= 0 ? newAmount.toString() : '0');
    };

    const timeTill = useTimeTill(stakeUnlockTime);
    const getTimeUntilUnlock = (timeRemaining: number) => {
        if (timeRemaining <= 0) return "Stake is unlocked";

        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = Math.floor(timeRemaining % 60);

        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <Dialog open={show} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unstake {Attribute[attribute]}</DialogTitle>
                    <DialogDescription>
                        You own: {yourShares} shares of this character.
                        Enter the amount you wish to unstake for {Attribute[attribute]}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unstakeAmount" className="text-right">
                            Amount
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={decrementAmount}>-</Button>
                            <Input
                                id="unstakeAmount"
                                type="text"
                                value={unstakeAmount}
                                onChange={handleAmountChange}
                                placeholder="Enter amount"
                                className="col-span-2"
                            />
                            <Button variant="outline" size="icon" onClick={incrementAmount}>+</Button>
                        </div>
                    </div>
                    <div className="text-md font-medium">
                        Time until unlock: {getTimeUntilUnlock(timeTill)}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleClose} variant="outline" className="mr-2">Cancel</Button>
                    <Button onClick={handleUnstake} disabled={unstakeAmount <= 0 || isPending}>
                        {isPending ? 'Unstaking...' : 'Unstake'}
                    </Button>
                </DialogFooter>
                {isError && <p className="text-red-500">Error occurred while unstaking: {error.message} </p>}
                {isSuccess && <p className="text-green-500">Unstaking successful!</p>}
            </DialogContent>
        </Dialog>
    );
};

export default ModalUnstake;