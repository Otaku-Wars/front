import React, { useCallback, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './ModalWithdraw.css';
import { useWithdraw } from '../hooks/user';
import { isAddress } from 'viem';

export const ModalWithdraw = ({ show, handleClose }: { show: boolean, handleClose: () => void }) => {
    const [amount, setAmount] = useState<number | string>(0);
    const [walletAddress, setWalletAddress] = useState<`0x${string}` | any>("");

    const { 
        withdraw, 
        isPending, 
        error, 
        isSuccess 
    } = useWithdraw();

    const handleAmountChange = (e: any) => {
        setAmount(e.target.value);
    };

    const handleWalletAddressChange = (e: any) => {
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


    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Body className="withdraw-modal-body">
                <h4 className="text-center">Withdraw</h4>
                <Form.Group controlId="formWalletAddress" className="mb-3">
                    <Form.Label>Wallet Address</Form.Label>
                    <Form.Control
                        type="text"
                        value={walletAddress}
                        onChange={handleWalletAddressChange}
                        placeholder="Enter wallet address"
                    />
                </Form.Group>
                <Form.Group controlId="formAmount" className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                    />
                    <Button variant="outline-dark" className="max-button">Max</Button>
                </Form.Group>
                <div className="text-center">
                    <Button 
                        variant="dark" 
                        className="withdraw-button"
                        onClick={handleWithdraw}
                    >
                        {isPending ? 'Withdrawing...' : 'Withdraw'}
                    </Button>
                </div>
                <div className="text-center">
                    {error && <p className="text-danger">{error.message}</p>}
                    {isSuccess && <p className="text-success">Withdrawal successful!</p>}
                </div>
            </Modal.Body>
        </Modal>
    );
};
