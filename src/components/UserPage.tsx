import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { ModalWithdraw } from './ModalWithdraw'; // Import the WithdrawModal component
import './UserPage.css';
import { useAddress, useBalance } from '../hooks/user';
import { truncateWallet } from './NavBar';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../main';
import { convertWeiToEth, useGetSellPrices, useSellPrice } from '../hooks/contract';

export const UserPage = () => {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const address = useAddress();
    const { balance: userBalance } = useBalance(address as `0x${string}`);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`);
            return response.json();
        },
        refetchInterval: 1000,
    });

    const userData: any = useMemo(() => {
        if (isLoading || isError) return null;
        return data?.users?.find((u: any) => u?.address?.toLowerCase() === id?.toLowerCase()) ?? null;
    }, [data, isLoading, isError, id]);

    const characters: any = useMemo(() => {
        if (isLoading || isError ) return null;
        return data?.characters;
    }, [data, isLoading, isError])

    const { data: sellPrices } = useGetSellPrices(
            userData?.
                balances.
                    map((b: any) => {
                        return { 
                            characterId: b.character, 
                            amount: b.balance
                        }
                    }) ?? []) ?? [];
    
    const netWorth = useMemo(() => {
        //add all sellPrices[].result together
        return sellPrices?.reduce((acc: number, curr: any) => acc + (convertWeiToEth(curr.result)), 0) ?? 0;
    }, [sellPrices]);

    console.log("sellPrices", sellPrices);

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    return (
        <div className="user-page-container">
            <Card className="user-card bg-dark">
                <Card.Body>
                    <div className="user-info">
                        <div className="avatar-placeholder"></div>
                        <h4 className="user-name">{id}</h4>
                    </div>
                    <div className="wallet-info mt-3">
                        <p className="wallet-label">Wallet Address: {address}</p>
                        <p className="wallet-address">{truncateWallet(address)}</p>
                        <Button variant="warning" onClick={() => {
                            navigator.clipboard.writeText(address);
                        }} className="copy-button">Copy</Button>
                    </div>
                    <div className="deposit-info mt-4">
                        <p>How to Deposit: Copy your wallet address. Send funds to it. Wait for balance to appear within UI. You are ready to buy your favorite character.</p>
                    </div>
                    <div className="balance-info mt-4">
                        <p>Wallet Balance: {userBalance} ETH</p>
                        <Button variant="warning" className="withdraw-button" onClick={handleShowModal}>
                            Withdraw
                        </Button>
                    </div>
                    <div className="portfolio-info mt-4">
                        <p>Net worth: {netWorth} ETH</p>
                        <ListGroup variant="flush">
                            {userData?.balances.map((balance: any | null, index: number) => {
                                const value = sellPrices && sellPrices[index] ? convertWeiToEth(sellPrices[index].result as bigint) : 0;
                                return <ListGroup.Item key={index} className="portfolio-item bg-warning">
                                    <span className="item-name">{characters?.find((c: any) => c.id === balance.character)?.name ?? "Loading"}</span>
                                    <span className="item-details">{balance.balance} SHARES</span>
                                    <span className='item-value'>{value} ETH</span>
                                </ListGroup.Item>
                            })}
                            {userData?.balances.length === 0 && (
                                <ListGroup.Item className="portfolio-item bg-warning">
                                    <span className="item-name">No characters owned.</span>
                                </ListGroup.Item>
                            )}
                        </ListGroup>
                    </div>
                    <div className="logout mt-4">
                        <Button 
                            variant="warning" 
                            className="logout-button"
                            
                        >Logout</Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Render the WithdrawModal */}
            <ModalWithdraw 
                show={showModal} 
                handleClose={handleCloseModal} 
            />
        </div>
    );
};
