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
import { usePrivy } from '@privy-io/react-auth';
import { Image } from 'react-bootstrap';

import Identicon from 'identicon.js';


export const UserPage = () => {
    const navigate = useNavigate()
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const address = useAddress();
    const { balance: userBalance } = useBalance(address as `0x${string}`);
    const  { logout } = usePrivy();

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

    const identiconImg = useMemo(() => {
        return new Identicon(id, address).toString();
    }, [id, address]);


    const netWorth = useMemo(() => {
        return sellPrices?.reduce((acc: number, curr: any) => acc + convertWeiToEth(curr.result), 0) ?? 0;
    }, [sellPrices]);

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    return (
        <div className="user-page-container">
            <div className='user-card'>
                <div className="user-info">
                    <Image
                        className="user-avatar"
                        src={`https://static.vecteezy.com/system/resources/thumbnails/004/511/281/small/default-avatar-photo-placeholder-profile-picture-vector.jpg`}
                    />
                    <h4 className="user-name">{truncateWallet(id)}</h4>
                </div>
                <div className="wallet-info">
                    <div>
                        
                        <p className="wallet-address">Wallet Address: <br /> {address}</p>
                    </div>
                    <Button 
                        variant="outline-light" 
                        onClick={() => navigator.clipboard.writeText(address)} 
                        className="copy-button"
                    >
                        Copy
                    </Button>
                </div>
                <div className="deposit-info">
                    <p>How to Deposit: Copy your wallet address. Send funds to it. Wait for balance to appear within UI. You are ready to buy your favorite character.</p>
                </div>
                <div className="balance-info">
                    <p >Cash: {userBalance} ETH </p>
                    <Button 
                    variant='outline-light'
                        className="withdraw-button" 
                        onClick={handleShowModal}
                    >
                        Withdraw
                    </Button>
                </div>
                <div className="portfolio-info">
                    <p>Portfolio: {netWorth} ETH</p>
                    <ListGroup variant="flush">
                        {userData?.balances?.map((balance: any, index: number) => {
                            const value = sellPrices && sellPrices[index] ? convertWeiToEth(sellPrices[index].result as any) : 0;
                            return (
                                <ListGroup.Item 
                                    key={index} 
                                    className="portfolio-item"
                                    onClick={() => navigate(`/character/${characters?.find((c: any) => c.id === balance.character)?.name}`)}
                                >
                                    <div className=''>{characters?.find((c: any) => c.id === balance.character)?.name ?? "Loading"}</div>
                                    <div className="item-name">{balance.balance} Shares</div>
                                    <div className='item-value'>{value} ETH</div>
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
                <div className="logout">
                    <Button 
                        variant="outline-light" 
                        className="logout-button"
                        onClick={() => logout()}
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
