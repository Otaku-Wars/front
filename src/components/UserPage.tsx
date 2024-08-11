import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { ModalWithdraw } from './ModalWithdraw'; 
import './UserPage.css';
import { useAddress, useBalance } from '../hooks/user';
import { truncateWallet } from './NavBar';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../main';
import { convertWeiToEth, useGetSellPrices } from '../hooks/contract';
import Jazzicon from 'react-jazzicon'



export const UserPage = () => {
    const navigate = useNavigate()
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

    const userData = useMemo(() => {
        if (isLoading || isError) return null;
        return data?.users?.find((u: any) => u?.address?.toLowerCase() === id?.toLowerCase()) ?? null;
    }, [data, isLoading, isError, id]);

    const characters = useMemo(() => {
        if (isLoading || isError) return null;
        return data?.characters;
    }, [data, isLoading, isError]);

    const { data: sellPrices } = useGetSellPrices(
        userData?.balances?.map((b: any) => ({
            characterId: b.character,
            amount: b.balance
        })) ?? []
    );

    const netWorth = useMemo(() => {
        return sellPrices?.reduce((acc: number, curr: any) => acc + convertWeiToEth(curr.result), 0) ?? 0;
    }, [sellPrices]);

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    return (
        <div className="user-page-container">
            <div className='user-card'>
                <div className="user-info">
                    <Jazzicon diameter={50} seed={parseInt(id, 16)} />
                    <h4 className="user-name">{truncateWallet(id)}</h4>
                </div>
                <div className="wallet-info mt-3">
                    <div>
                    <p className="wallet-label">Wallet Address:</p>
                    <p className="wallet-address">{truncateWallet(address)}</p>

                    </div>
                    <Button 
                        variant="outline-light" 
                        onClick={() => navigator.clipboard.writeText(address)} 
                        className="copy-button"
                    >
                        Copy
                    </Button>
                </div>
                <div className="deposit-info mt-4">
                    <p>How to Deposit: Copy your wallet address. Send funds to it. Wait for balance to appear within UI. You are ready to buy your favorite character.</p>
                </div>
                <div className="balance-info mt-4">
                    <p >Balance: {userBalance} ETH </p>
                    <Button 
                        variant="warning" 
                        className="withdraw-button" 
                        onClick={handleShowModal}
                    >
                        Withdraw
                    </Button>
                </div>
                <div className="portfolio-info mt-4">
                    <p>Portfolio: {netWorth} ETH</p>
                    <ListGroup variant="flush">
                        {userData?.balances?.map((balance: any, index: number) => {
                            const value = sellPrices && sellPrices[index] ? convertWeiToEth(sellPrices[index].result) : 0;
                            return (
                                <ListGroup.Item 
                                    key={index} 
                                    className="portfolio-item bg-warning"
                                    onClick={() => navigate(`/character/${characters?.find((c: any) => c.id === balance.character)?.name}`)}
                                >
                                    <span className="item-name"> {balance.balance}  "{characters?.find((c: any) => c.id === balance.character)?.name ?? "Loading"}"  </span>
                                    <span className="item-details">SHARES </span>
                                    <span className='item-value'> worth  {value} ETH  </span>
                                </ListGroup.Item>
                            );
                        })}
                        {userData?.balances?.length === 0 && (
                            <ListGroup.Item className="portfolio-item">
                                <span className="">No characters owned.</span>
                            </ListGroup.Item>
                        )}
                    </ListGroup>
                </div>
                <div className="logout mt-4">
                    <Button 
                        variant="outline-light" 
                        className="logout-button"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* Render the WithdrawModal */}
            <ModalWithdraw 
                show={showModal} 
                handleClose={handleCloseModal} 
            />
        </div>
    );
};
