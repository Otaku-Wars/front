import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useStake } from '../hooks/contract';
import { Attribute } from '@memeclashtv/types';

interface ModalStakeProps {
    show: boolean;
    handleClose: () => void;
    characterId: number;
    attribute: number;
}

const ModalStake: React.FC<ModalStakeProps> = ({ show, handleClose, characterId, attribute }) => {
    const [stakeAmount, setStakeAmount] = useState(0);

    const { stakeShares, isError, isSuccess, isPending, error } = useStake(characterId, attribute, BigInt(stakeAmount) as any);

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

    return (
        <Dialog open={show} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Stake {attribute}</DialogTitle>
                    <DialogDescription>
                        Enter the amount you wish to stake for {attribute}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="stakeAmount" className="text-right">
                            Amount
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="stakeAmount"
                                type="text" // Change type to text to allow empty string
                                value={stakeAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty string or valid number
                                    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                                        setStakeAmount(value as any); // Set amount directly to the input value
                                    }
                                }}
                                placeholder="Enter amount"
                            />
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