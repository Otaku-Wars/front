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

    const { isLoading : isLoadingYourShares, data: yourShares } = useCharacterSharesBalance(character?.id ?? 0, address)
    
    console.log("your shares", yourShares)

    return (
        <div className="character-page-container">
            <Card className="character-card">
                <Card.Body className='flex flex-row w-100 gap-30 justify-content-between'>
                <div className="d-flex justify-content-between align-items-center w-100 gap-50"
                    style={{ justifyContent: 'space-between !important' }}
                >
                            <div className="d-flex align-items-center">
                                <Image 
                                    src={character?.pfp} 
                                    alt="Character Avatar" 
                                    className="avatar" 
                                    roundedCircle
                                    width={200}
                                    height={200}
                                />
                                <h1 className="ms-3"> {character?.name ?? id} </h1>
                            </div>
                            <h5 className="character-rank">Rank: #{character?.rank ?? "Loading"}</h5>
                    </div>
                    <div className='d-flex flex-row w-100 gap-10 justify-content-between'
                        style={{ justifyContent: 'space-between !important' }}
                    >
                        <div style={{ width: '400px' }}>
                            
                            <div className="character-stats mt-4">
                                <h5>Stats</h5>
                                <Table borderless className="mb-4 character-stats">
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
                                </Table>
                                <div className="stat-bars">
                                    <div className="mb-2">
                                        <p>Health</p>
                                        <ProgressBar now={character?.health ?? 0} label={`${character?.health ?? 0}`} className="bg-warning" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Power</p>
                                        <ProgressBar now={character?.power ?? 0} label={`${character?.power ?? 0}`} className="bg-warning" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Attack</p>
                                        <ProgressBar now={character?.attack ?? 0} label={`${character?.attack ?? 0}`} className="bg-warning" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Defence</p>
                                        <ProgressBar now={character?.defence ?? 0} label={`${character?.defence ?? 0}`} className="bg-warning" />
                                    </div>
                                    <div className="mb-2">
                                        <p>Speed</p>
                                        <ProgressBar now={character?.speed ?? 0} label={`${character?.speed ?? 0}`} className="bg-warning" />
                                    </div>
                                </div>
                            </div>
                        </div>
                
                        <div className="character-ownership mt-4"
                            style={{ width: '400px' }}
                        >
                            <h5>You Own: {yourShares as number ?? "Loading..."} shares of {id}</h5>
                            <Table borderless className="mb-3">
                                <thead>
                                    <tr>
                                        <th>Price</th>
                                        <th>Market Cap</th>
                                        <th>Supply</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{character?.price ?? "Loading..."}</td>
                                        <td>{character?.value ?? "Loading..."}</td>
                                        <td>{character?.supply ?? "Loading..."}</td>
                                    </tr>
                                </tbody>
                            </Table>
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
