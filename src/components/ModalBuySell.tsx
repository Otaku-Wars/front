import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './ModalBuySell.css';
import { BigNumber } from 'ethers';
import { useBuyShares, useBuyPrice, useCharacterSharesBalance, convertEthToWei, useSellShares, useSellPrice } from '../hooks/contract'; // Import your hooks
import { useWallets } from '@privy-io/react-auth';
import { useAddress } from '../hooks/user';

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
        // Else handle Sell case as needed with another hook for selling
    };

    const {data: yourShares} = useCharacterSharesBalance(characterId ?? 0, address)


    return (
        <Modal show={show} onHide={
            handleClose
            } centered>
            <Modal.Body className="buy-sell-modal-body">
                <h4 className="text-center">You Own: {yourShares?.toString() ?? 0} Shares of {characterName}</h4>
                <div className="text-center mb-3">
                    <Button 
                      variant={actionType === 'Buy' ? 'secondary' : 'outline-secondary'} 
                      className="buy-sell-button"
                      onClick={() => setAmount(0)} // Reset amount on Buy/Sell switch
                    >
                        Buy
                    </Button>
                    <Button 
                      variant={actionType === 'Sell' ? 'secondary' : 'outline-secondary'} 
                      className="buy-sell-button"
                      onClick={() => setSellAmount(0)} // Reset amount on Buy/Sell switch
                    >
                        Sell
                    </Button>
                </div>
                <Form.Group controlId="formAmount" className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control 
                        type="number" 
                        value={actionType === 'Buy' ? amount : sellAmount} 
                        onChange={handleAmountChange} />
                    <Button variant="outline-dark" className="max-button">Max</Button>
                </Form.Group>
                <div className="text-center">
                    <Button 
                      variant="dark" 
                      className="place-trade-button" 
                      onClick={handlePlaceTrade}
                      disabled={isBuying || isPriceLoading || isSelling || isSellPriceLoading}
                    >
                        {isBuying ? 'Buying...' : isSelling ? 'Selling...' : 'Place Trade'}
                    </Button>
                </div>
                <p className="text-center mt-3 text-muted">
                    {isPriceLoading ? 'Loading...' : isSellPriceLoading ? 'Loading...' : actionType === 'Buy' ? `Buy Price: ${buyPrice} ETH` : `Sell Price: ${sellPrice} ETH`}
                </p>

                {actionType == 'Buy' && <>
                {buyError && <p className="text-danger text-center mt-3">Error: {buyError.message}</p>}
                {priceError && <p className="text-danger text-center mt-3">Error: {priceError.message}</p>}
                {buySuccess && <p className="text-success text-center mt-3">Buy order Successful!</p>}
                </>}

                {actionType == 'Sell' && <>
                    {sellPriceError && <p className="text-danger text-center mt-3">Error: {sellPriceError.message}</p>}
                    {sellError && <p className="text-danger text-center mt-3">Error: {sellError.message}</p>}
                    {sellSuccess && <p className="text-success text-center mt-3">Sell order Successful!</p>}
                </>}
                
            </Modal.Body>
        </Modal>
    );
};
