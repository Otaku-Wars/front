import React, { useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './WorldStateView.css'; // Import your custom styles
import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../main';

//timeer hook
import { useEffect, useState } from 'react';
import { Image } from 'react-bootstrap';
import { convertEthToUsd,  } from './CharacterList';
import { useBattleState, useCharacters } from '../hooks/api';
import { getBuyPrice } from '../utils';
// Time in seconds that the match will start
export const useTimeTill = (time: number) => {
    const [timeTill, setTimeTill] = useState(Math.max(0, Math.floor((time - Date.now()) / 1000)));
    console.log("timeTill", timeTill)
    console.log("time", time)
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeTill((prevTimeTill) => {
                const now = Date.now() / 1000;
                console.log("now", now)
                const currentTimeTill = Math.floor(time - now);
                return currentTimeTill > 0 ? currentTimeTill : 0;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [time]);

    return timeTill;
}

export const WorldStateView = () => {
    const { data: characters, isLoading: charactersLoading, isError: charactersError } = useCharacters();
    const { data: battleState, isLoading, isError } = useBattleState();

    const character1 = useMemo(() => {
        if(isLoading) return null
        if(isError) return null
        const p1Id = battleState?.p1;
        return characters?.find((c: any) => c.id === p1Id);
    }, [characters, battleState, isLoading, isError])

    const character2 = useMemo(() => {
        if(isLoading) return null
        if(isError) return null
        const p2Id = battleState?.p2;
        return characters?.find((c: any) => c.id === p2Id);
    }, [characters, battleState, isLoading, isError])

    const character1Price = useMemo(()=> {
        return character1 ? character1.price : 0;
    }, [character1])

    const character2Price = useMemo(()=> {
        return character2 ? character2.price : 0;
    }, [character2])

    const character1MarketCap = useMemo(() => {
        return character1 ? character1.value : 0;
    }, [character1])

    const character2MarketCap = useMemo(() => {
        return character2 ? character2.value : 0;
    }, [character2])

    const character1WinMarketCap = useMemo(() => {
        const reward = (character2MarketCap * 0.1);
        return convertEthToUsd(character1MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character2WinMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return convertEthToUsd(character2MarketCap + reward);
    }, [character1MarketCap, character2MarketCap])

    const character1LossMarketCap = useMemo(() => {
        const reward = (character1MarketCap * 0.1);
        return convertEthToUsd(character1MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const character2LossMarketCap = useMemo(() => {
        const reward = (character2MarketCap * 0.1);
        return convertEthToUsd(character2MarketCap - reward);
    }, [character1MarketCap, character2MarketCap])

    const character1WinPrice = useMemo(() => {
        const price = getBuyPrice(character1?.supply ?? 0, parseFloat(character1WinMarketCap))
        return convertEthToUsd(price);
    }, [character1WinMarketCap])

    const character2WinPrice = useMemo(() => {
        const price = getBuyPrice(character2?.supply ?? 0, parseFloat(character2WinMarketCap))
        return convertEthToUsd(price);
    }, [character2WinMarketCap])

    const character1LossPrice = useMemo(() => {
        const price = getBuyPrice(character1?.supply ?? 0, parseFloat(character1LossMarketCap))
        return convertEthToUsd(price);
    }, [character1LossMarketCap])

    const character2LossPrice = useMemo(() => {
        const price = getBuyPrice(character2?.supply ?? 0, parseFloat(character2LossMarketCap))
        return convertEthToUsd(price);
    }, [character2LossMarketCap])



    const isPendingMAtch = useMemo(() => {
        return battleState?.status == 1;
    }, [battleState])

    const winner = useMemo(() => {
        return battleState?.lastMatchResult;
    }, [battleState])

    

    console.log("data will start at", battleState?.willStartAt)
    const willStartIn = useTimeTill(battleState?.willStartAt ?? 0);

    return (
        <Card className="world-state-card bg-dark w-100">
            <Card.Body className="w-100">
                <Row className="align-items-center text-center w-100 justify-content-evenly">
                    <Col className='flex flex-col justify-content-start'>
                        <h4 className="">
                            {character1?.name}
                        </h4>
                        <p className="text-light">
                            <span>10💚</span> 
                            <span>45💎</span> 
                            <span>5🔥</span> 
                            <span>18🛡️</span> 
                            <span>56⚡</span>
                        </p>
                        <p className="text-light">Current Price: ${(character1Price)}</p>
                        <p className="text-light">Mktcap: ${(character1MarketCap / 1e6)}m</p>
                        <p className="text-success">Win price: ${(character1WinPrice)} (+15%)</p>
                        <p className="text-danger">Lose price: ${(character1LossPrice)} (-90%)</p>
                    </Col>
                    <Col className="">
                        <p id="next-match" className="next-match-main">
                            {battleState?.status === 1 && `Match starting in ${willStartIn}S`}
                        </p>
                        <h4 className="vs-text">VS</h4>
                    </Col>
                    <Col className='flex flex-col justify-content-start'>
                        <h4 className="">
                            {character2?.name}
                        </h4>
                        <p className="text-light">
                            <span>10💚</span> 
                            <span>45💎</span> 
                            <span>5🔥</span> 
                            <span>18🛡️</span> 
                            <span>56⚡</span>
                        </p>
                        <p className="text-light">Current Price: ${(character2Price)}</p>
                        <p className="text-light">Mktcap: ${(character2MarketCap / 1e6)}m</p>
                        <p className="text-success">Win price: ${(character2WinPrice)} (+15%)</p>
                        <p className="text-danger">Lose price: ${(character2LossPrice)} (-90%)</p>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};
