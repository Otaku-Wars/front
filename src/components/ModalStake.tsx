import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useCharacterSharesBalance, useStake } from '../hooks/contract';
import { Attribute } from '@memeclashtv/types';
import { useAddress } from '../hooks/user';

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

interface ModalStakeProps {
    show: boolean;
    handleClose: () => void;
    characterId: number;
    attribute: number;
}

const ModalStake: React.FC<ModalStakeProps> = ({ show, handleClose, characterId, attribute }) => {
    const [stakeAmount, setStakeAmount] = useState<any>(0);
    const address = useAddress();

    const { stakeShares, isError, isSuccess, isPending, error } = useStake(characterId, attribute, BigInt(stakeAmount) as any);
    const { data: yourShares } = useCharacterSharesBalance(characterId ?? 0, address);

    const handleStake = () => {
        // Logic to handle staking
        console.log(`Staking ${stakeAmount} for ${attribute} on character ${characterId}`);
        stakeShares();
        // Reset the input after staking
        setStakeAmount('' as any); // Reset to empty string
        //handleClose(); // Close the modal
    };

    useEffect(() => {
        if (show) {
            setStakeAmount(0); // Reset amount when modal opens
        }
    }, [show]);

    useEffect(() => {
        // Reset the input after staking
        if (isSuccess) {
            setStakeAmount(0);
        }
    }, [isSuccess]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setStakeAmount(value as any);
        }
    };

    const incrementAmount = () => {
        setStakeAmount((prev) => (prev === '' ? '1' : (parseInt(prev) + 1).toString()));
    };

    const decrementAmount = () => {
        const newAmount = parseInt(stakeAmount) - 1;
        setStakeAmount(newAmount >= 0 ? newAmount.toString() : '0');
    };

    return (
        <Dialog open={show} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Stake {capitalizeFirstLetter(Attribute[attribute])}</DialogTitle>
                    <DialogDescription>
                        You own: {yourShares} shares of this character.
                        Enter the amount you wish to stake for {capitalizeFirstLetter(Attribute[attribute])}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stakeAmount" className="text-right">
                            Amount
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={decrementAmount}>-</Button>
                            <Input
                                id="stakeAmount"
                                type="text"
                                value={stakeAmount}
                                onChange={handleAmountChange}
                                placeholder="Enter amount"
                                className="col-span-2"
                            />
                            <Button variant="outline" size="icon" onClick={incrementAmount}>+</Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleClose} variant="outline" className="mr-2">Cancel</Button>
                    <Button onClick={handleStake} disabled={stakeAmount <= 0 || isPending}>
                        {isPending ? 'Staking...' : 'Stake'}
                    </Button>
                </DialogFooter>
                {isError && <p className="text-red-500">Error occurred while staking: {error.message} </p>}
                {isSuccess && <p className="text-green-500">Staking successful!</p>}
            </DialogContent>
        </Dialog>
    );
};

export default ModalStake;