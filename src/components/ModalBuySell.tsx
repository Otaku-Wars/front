import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './ModalBuySell.css';
import { BigNumber } from 'ethers';
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, convertEthToWei, useSellShares, useSellPrice } from '../hooks/contract'; // Import your hooks
import { useAddress } from '../hooks/user';
import { DefaultModal } from './Modal';

export const ModalBuySell = ({ show, handleClose, actionType, characterName, characterId }: 
  { show: boolean, handleClose: () => void, actionType: string, characterName: string, characterId: number }) => {
    const [amount, setAmount] = useState(0);
    const [sellAmount, setSellAmount] = useState(0);
    const address = useAddress();

    // Get the buy price for the given character and amount
    const { 
        data: buyPrice, 
        isPending: isPriceLoading, 
        error: priceError 
    } = useBuyPrice(
        characterId, 
        BigNumber.from(amount ?? 0)
    );

    // Get the sell price for the given character and amount
    const {
        data: sellPrice,
        isPending: isSellPriceLoading,
        error: sellPriceError
    } = useSellPrice(
        characterId,
        BigNumber.from(sellAmount ?? 0)
    );
    
    // Hook to execute the buy shares function
    const { 
        buyShares, 
        isPending: isBuying, 
        error: buyError, 
        isSuccess: buySuccess 
    } = useBuyShares(
        characterId, 
        BigNumber.from(amount ?? 0), 
        convertEthToWei(buyPrice ?? 0),
    )

    // Hook to execute the sell shares function
    const { 
        sellShares, 
        isPending: isSelling, 
        error: sellError, 
        isSuccess: sellSuccess 
    } = useSellShares(
        characterId, 
        BigNumber.from(sellAmount ?? 0), 
    )

    const handleAmountChange = (e: any) => {
        const value = parseInt(e.target.value === '' ? '0' : e.target.value);
        if (actionType === 'Buy') setAmount(value);
        else setSellAmount(value);
    };

    const handlePlaceTrade = () => {
        if (actionType === 'Buy') {
            buyShares(); // Call the buy shares function when the button is clicked
        } else {
            sellShares(); // Call the sell shares function when the button is clicked
        }
    };

    const incrementAmount = () => {
        if (actionType === 'Buy') setAmount(amount + 1);
        else setSellAmount(sellAmount + 1);
    };

    const decrementAmount = () => {
        if (actionType === 'Buy' && amount > 0) setAmount(amount - 1);
        else if (actionType === 'Sell' && sellAmount > 0) setSellAmount(sellAmount - 1);
    };

    const {data: yourShares} = useCharacterSharesBalance(characterId ?? 0, address)

    return (
        <DefaultModal
            title=""
            show={show}
            handleClose={handleClose}
        >   
            <div className="buy-sell-button-group">
                <Button 
                  className={`buy-sell-button ${actionType === 'Buy' ? 'active' : ''}`} 
                  onClick={() => setAmount(0)}
                >
                    Buy
                </Button>
                <Button 
                  className={`buy-sell-button ${actionType === 'Sell' ? 'active' : ''}`} 
                  onClick={() => setSellAmount(0)}
                >
                    Sell
                </Button>
            </div>

            <Form.Group className="form-group">
                <div className="decrement-button" onClick={decrementAmount}>-</div>
                <Form.Control 
                    type="number" 
                    value={actionType === 'Buy' ? amount : sellAmount} 
                    onChange={handleAmountChange} 
                />
                <div className="increment-button" onClick={incrementAmount}>+</div>
            </Form.Group>

            <Button 
                className="max-button"
                onClick={() => setAmount(100)} // Example logic for Max button, adjust accordingly
            >
                Max
            </Button>

            <Button 
                className="place-trade-button" 
                onClick={handlePlaceTrade}
                disabled={isBuying || isPriceLoading || isSelling || isSellPriceLoading}
            >
                {isBuying ? 'Buying...' : isSelling ? 'Selling...' : actionType}
            </Button>

            <p className="text-stats">
                {isPriceLoading ? 'Loading...' : isSellPriceLoading ? 'Loading...' : actionType === 'Buy' ? `Est. amount of shares ${buyPrice}` : `Est. amount of shares ${sellPrice}`}
            </p>
        </DefaultModal>
    );
};
