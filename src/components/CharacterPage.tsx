import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Table from 'react-bootstrap/Table';
import { ModalBuySell } from './ModalBuySell';
import './CharacterPage.css';
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../main';
import { useCharacterSharesBalance } from '../hooks/contract';
import { useWallets } from '@privy-io/react-auth';
import { Image } from 'react-bootstrap';
import { useAddress } from '../hooks/user';
import { convertEthToUsd } from './CharacterList';

export const CharacterPage = () => {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState('Buy');
    const address = useAddress()
    console.log("charPage address", address) 

    const handleShowModal = (action: any) => {
        setModalAction(action);
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`)
            return response.json()
        },
        refetchInterval: 1000,
    })

    const character = useMemo(() => {
        if(isLoading) return null
        if(isError) return null;
        return data?.characters?.find((c: any) => c?.name.toLowerCase() == id?.toLowerCase())
    }, [id, data, isLoading, isError])

    const { data: yourShares } = useCharacterSharesBalance(character?.id ?? 0, address)
    
    console.log("your shares", yourShares)

    return (
        <div className="character-page-container">
            <Card className="character-card">
                <Card.Body className='flex flex-col gap-30 align-items-center'>
                <div className="d-flex align-items-center justify-content-between">
                
                                <Image 
                                    src={character?.pfp} 
                                    alt="Character Avatar" 
                                    className="character-page-avatar" 
                                />
                                <h1 className="character-name"> {character?.name ?? id} </h1>
                            <h5 className="character-rank">Rank #{character?.rank ?? "Loading"}</h5>
                    </div>
                    <div className='flex flex-col w-100 gap-10 justify-content-between'
                        style={{ justifyContent: 'space-between !important' }}
                    >
                        <div className="character-ownership"
                        >
                            {/* <h5>You Own: {yourShares as number ?? "Loading..."} shares of {id}</h5> */}
                                <div className='d-flex justify-content-between gap-20 mt-20 mb-20'>
                                    <div className='flex flex-col'>
                                        <div className="attribute-header">Price</div>
                                        <div className="attribute-value">${convertEthToUsd(character?.price) ?? "Loading..."}</div>
                                    </div>
                                    <div className='flex flex-col'>
                                        <div className="attribute-header">Market Cap</div>
                                        <div className="attribute-value">${convertEthToUsd(character?.value) ?? "Loading..."}</div>
                                    </div>
                                    <div className='flex flex-col'>
                                        <div className="attribute-header">Supply</div>
                                        <div className="attribute-value">{character?.supply ?? "Loading..."}</div>
                                    </div>
                                </div>
                                
                            <div className="d-flex justify-content-between">
                                <Button variant="outline-dark" className="buy-button" onClick={() => handleShowModal('Buy')}
                                    disabled={isLoading}
                                >
                                    Buy
                                </Button>
                                <Button 
                                    disabled={isLoading}
                                variant="outline-dark" className="sell-button" onClick={() => handleShowModal('Sell')}>
                                    Sell
                                </Button>
                            </div>
                        </div>
                        <div style={{ width: '400px' }}>
                            
                            <div className="character-stats">
                                <h5>Key Stats</h5>
                                <div className="d-flex justify-content-between">
                                    <div className="flex flex-col align-items-center">
                                        <p className='stats-header'>Wins</p>
                                        <p className='stats-value'>{character?.winCount ?? "Loading..."}</p>
                                    </div>
                                    <div className="flex flex-col align-items-center">
                                        <p className="stats-header">Losses</p>
                                        <p className='stats-value'>{character?.lossCount ?? "Loading..."}</p>
                                    </div>
                                    <div className="flex flex-col align-items-center">
                                        <p className='stats-header'>Matches</p>
                                        <p className='stats-value'>{character?.matchCount ?? "Loading..."}</p>
                                    </div>
                                </div>
                                {/* <Table borderless className="mb-4 character-stats">
                                    <thead>
                                        <tr>
                                            <th>Matches</th>
                                            <th>Wins</th>
                                            <th>Losses</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{character?.matchCount ?? "Loading..." }</td>
                                            <td>{character?.winCount ?? "Loading..." }</td>
                                            <td>{character?.lossCount ?? "Loading..." }</td>
                                        </tr>
                                    </tbody>
                                </Table> */}
                                <div className="stat-bars">
                                    <div className="flex flex-row">
                                        <p>Health</p>
                                        <ProgressBar now={100} label={`${character?.health ?? 0}`} className="progress-bar" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Power</p>
                                        <ProgressBar now={character?.power ?? 0} label={`${character?.power ?? 0}`} className="progress-bar" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Attack</p>
                                        <ProgressBar now={character?.attack ?? 0} label={`${character?.attack ?? 0}`} className="progress-bar" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Defence</p>
                                        <ProgressBar now={character?.defence ?? 0} label={`${character?.defence ?? 0}`} className="progress-bar" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Speed</p>
                                        <ProgressBar now={character?.speed ?? 0} label={`${character?.speed ?? 0}`} className="progress-bar" />
                                    </div>
                                </div>
                            </div>
                        </div>
                
                        
                    </div>
                    
                </Card.Body>
            </Card>

            {/* Render the BuySellModal */}
            <ModalBuySell 
                characterId={parseInt(character?.id)}
                show={showModal} 
                handleClose={handleCloseModal} 
                actionType={modalAction} 
                characterName={id ?? "Character"}
            />
        </div>
    );
};
