import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './ModalBuySell.css';
import { BigNumber } from 'ethers';
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, convertEthToWei, useSellShares, useSellPrice } from '../hooks/contract'; // Import your hooks
import { useAddress, useBalance } from '../hooks/user';
import { DefaultModal } from './Modal';
import { convertEthToUsd } from './CharacterList';

export const ModalBuySell = ({ show, handleClose, actionType, characterName, characterId }: 
  { show: boolean, handleClose: () => void, actionType: string, characterName: string, characterId: number }) => {
    const [amount, setAmount] = useState(0);
    const [sellAmount, setSellAmount] = useState(0);
    const address = useAddress();
    const [defaultActionType, setDefaultActionType] = useState(actionType);

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

    const userBalance = useBalance(address as `0x${string}`);

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
        if (defaultActionType === 'Buy') setAmount(value);
        else setSellAmount(value);
    };

    const handlePlaceTrade = () => {
        if (defaultActionType === 'Buy') {
            buyShares(); // Call the buy shares function when the button is clicked
        } else {
            sellShares(); // Call the sell shares function when the button is clicked
        }
    };

    const incrementAmount = () => {
        if (defaultActionType === 'Buy') setAmount(amount + 1);
        else setSellAmount(sellAmount + 1);
    };

    const decrementAmount = () => {
        if (defaultActionType === 'Buy' && amount > 0) setAmount(amount - 1);
        else if (defaultActionType === 'Sell' && sellAmount > 0) setSellAmount(sellAmount - 1);
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
                  className={`buy-sell-button ${defaultActionType === 'Buy' ? 'buy-sell-button-active' : ''}`} 
                  onClick={() => setDefaultActionType('Buy')}
                >
                    Buy
                </Button>
                <Button 
                  className={`buy-sell-button ${defaultActionType === 'Sell' ? 'buy-sell-button-active' : ''}`} 
                  onClick={() => setDefaultActionType('Sell')}
                >
                    Sell
                </Button>
            </div>
            <div className="d-flex flex-row justify-content-between">
                <p className="text-stats">You Own: {yourShares} shares of {characterName}</p>
                <Button 
                    className="max-button"
                    onClick={() => setAmount(Number(defaultActionType === 'Buy' ? 1: yourShares??0))}
                >
                    Max
                </Button>
            </div>
            <Form.Group className="form-group">
                <div className="decrement-button" onClick={decrementAmount}>-</div>
                <Form.Control 
                    type="number" 
                    value={defaultActionType === 'Buy' ? amount : sellAmount} 
                    onChange={handleAmountChange} 
                />
                <div className="increment-button" onClick={incrementAmount}>+</div>
            </Form.Group>
            <p className="text-stats">
                You have {parseFloat(userBalance?.balance)?.toFixed(5)} ETH ({convertEthToUsd(parseFloat(userBalance?.balance ?? "0"))}) available to trade
                </p>

            

            <Button 
                className="place-trade-button" 
                onClick={handlePlaceTrade}
                disabled={isBuying || isPriceLoading || isSelling || isSellPriceLoading}
            >
                {isBuying ? 'Buying...' : isSelling ? 'Selling...' : defaultActionType}
            </Button>

            <p className="text-stats">
                {isPriceLoading ? 'Loading...' : isSellPriceLoading ? 'Loading...' : defaultActionType === 'Buy' ? `Est. cost ${buyPrice.toExponential(3)}ETH (${convertEthToUsd(buyPrice)})` : `Est. cost ${sellPrice.toExponential(3)} ETH (${convertEthToUsd(sellPrice)})`}
            </p>
        </DefaultModal>
    );
};
