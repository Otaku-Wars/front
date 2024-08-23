import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab, Tabs, Button, Image, ProgressBar } from 'react-bootstrap';
import { ModalBuySell } from './ModalBuySell';
import { MatchList } from './MatchList';
import { HolderList } from './HolderList';
import { TradeList } from './TradeList';
import { StakeList } from './StakeList';
import './CharacterPage.css';
import { useCharacter, useCharacterTrades, useCharacterPerformance, useCharacters } from '../hooks/api';
import { useCharacterSharesBalance } from '../hooks/contract';
import { useAddress } from '../hooks/user';
import { convertEthToUsd } from './CharacterList';
import { Chart } from './Chart';

type TimeFrame = 'Live' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

export const CharacterPage = () => {
    const { id } = useParams();
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState('Buy');
    const address = useAddress();
    const characterId = parseInt(id);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
    const [startTime, setStartTime] = useState<number>(Math.floor(Date.now() / 1000) - 24 * 60 * 60);
    const [activeTab, setActiveTab] = useState('matches');

    const { data: character, isLoading } = useCharacter(characterId);
    const { data: characters } = useCharacters();
    const { data: yourShares } = useCharacterSharesBalance(characterId, address);
    const { data: trades } = useCharacterTrades(characterId);
    const { data: performance } = useCharacterPerformance(characterId, startTime);

    //get total stakes by adding up all the stakes for each stat
    const totalStakes = useMemo(() => {
        return character?.healthStakes + character?.powerStakes + character?.attackStakes + character?.defenseStakes + character?.speedStakes;
    }, [character]);

    useEffect(() => {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        switch (selectedTimeFrame) {
            case 'Live':
                setStartTime(now - 60 * 60); // 1 hour ago
                break;
            case '1D':
                setStartTime(now - 24 * 60 * 60);
                break;
            case '1W':
                setStartTime(now - 7 * 24 * 60 * 60);
                break;
            case '1M':
                setStartTime(now - 30 * 24 * 60 * 60);
                break;
            case '3M':
                setStartTime(now - 90 * 24 * 60 * 60);
                break;
            case 'YTD':
                setStartTime(Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000));
                break;
            case '1Y':
                setStartTime(now - 365 * 24 * 60 * 60);
                break;
            case 'ALL':
                setStartTime(0); // From the beginning
                break;
        }
    }, [selectedTimeFrame]);

    const handleShowModal = (action: 'Buy' | 'Sell') => {
        setModalAction(action);
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleTimeFrameChange = (timeFrame: TimeFrame) => {
        setSelectedTimeFrame(timeFrame);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="character-page-container dark-theme">
            <div className="character-header">
                <div className="character-avatar-container">
                    <Image src={character?.pfp} alt="Character Avatar" className="character-avatar" roundedCircle />
                    <div className="character-tier">Tier S</div>
                </div>
                <div className="character-info">
                    <h1>{character?.name}</h1>
                    <div className="character-stats-summary">
                        <span>Health: {character?.health}</span>
                        <span>Power: {character?.power}</span>
                        <span>Attack: {character?.attack}</span>
                        <span>Defense: {character?.defense}</span>
                        <span>Speed: {character?.speed}</span>
                    </div>
                    <div className="character-performance">
                        <span>Wins: {character?.winCount}</span>
                        <span>Losses: {character?.lossCount}</span>
                        <span>Matches: {character?.matchCount}</span>
                        <span>Win odds: {((character?.winCount / character?.matchCount) * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div className="character-market-info">
                    <h2>${convertEthToUsd(character?.price)}</h2>
                    <span className="price-change">{performance?.toFixed(2)}% 24hr</span>
                    <div>Holders: Unavailable</div>
                    <div>Market Cap: ${convertEthToUsd(character?.value)}</div>
                </div>
            </div>

            <div className="chart-container">
                <Chart tradeActivities={trades || []} />
                <div className="chart-timeframes">
                    {(['Live', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'] as TimeFrame[]).map((timeFrame) => (
                        <button
                            key={timeFrame}
                            onClick={() => handleTimeFrameChange(timeFrame)}
                            className={selectedTimeFrame === timeFrame ? 'active' : ''}
                        >
                            {timeFrame}
                        </button>
                    ))}
                </div>
            </div>

            <div className="action-buttons">
                <Button variant="success" onClick={() => handleShowModal('Buy')}>Buy</Button>
                <Button variant="danger" onClick={() => handleShowModal('Sell')}>Sell</Button>
            </div>

            <div className="next-match">
                <h3>Next Match:</h3>
                <p>in {10}s vs {'TBD'}</p>
            </div>

            <div className="character-stats-detailed">
                <h3>Character Stats</h3>
                {['Health', 'Power', 'Attack', 'Defense', 'Speed'].map((stat) => (
                    <div key={stat} className="stat-row">
                        <span className={`stat-name ${stat.toLowerCase()}`}>{stat}</span>
                        <ProgressBar 
                            now={character[stat.toLowerCase()]} 
                            max={1090} 
                            label={`${character[stat.toLowerCase()]}`} 
                        />
                        <span className="stat-max">1090</span>
                        <Button variant="outline-primary" size="sm">Power Up</Button>
                        <div className="stat-details">
                            <span>Total stakes: {totalStakes}</span>
                            <span>Yours: {yourShares}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'matches')}
                className="mb-3 character-tabs"
            >
                <Tab eventKey="matches" title="Matches">
                    <MatchList characterId={characterId} characters={characters} />
                </Tab>
                <Tab eventKey="holders" title="Holders">
                    <HolderList characterId={characterId} characterMarketCap={character?.value} characterSupply={character?.supply}/>
                </Tab>
                <Tab eventKey="trades" title="Trades">
                    <TradeList characterId={characterId} characterImage={character?.pfp || ''} />
                </Tab>
                <Tab eventKey="stakes" title="Stakes">
                    <StakeList characterId={characterId} characterImage={character?.pfp || ''} />
                </Tab>
            </Tabs>

            <ModalBuySell 
                characterId={character?.id}
                show={showModal} 
                handleClose={handleCloseModal} 
                actionType={modalAction} 
                characterName={character?.name}
            />
        </div>
    );
};