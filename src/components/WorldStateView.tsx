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
import { convertEthToUsd, formatFloat } from './CharacterList';
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
    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`)
            return response.json()
        },
        refetchInterval: 1000,
    })

    const character1 = useMemo(() => {
        if(isLoading) return null
        if(isError) return "Error"
        const p1Id = data?.p1;
        return data?.characters?.find((c: any) => c.id === p1Id);
    }, [data, isLoading, isError])

    const character2 = useMemo(() => {
        if(isLoading) return null
        if(isError) return "Error"
        const p2Id = data?.p2;
        return data?.characters?.find((c: any) => c.id === p2Id);
    }, [data, isLoading, isError])

    const character1Loss = useMemo(()=> {
        console.log("character1", character1)
        return character1 ? character1.value/10 : 0;
    }, [character1])

    const character2Loss = useMemo(()=> {
        return character2 ? character2.value/10 : 0;
    }, [character2])

    const isPendingMAtch = useMemo(() => {
        return data?.status == 1;
    }, [data])

    const winner = useMemo(() => {
        return data?.lastWinner;
    }, [data])

    const price1IfWin = useMemo(() => {
        const price = character1?.price;
        const percentChange = character1?.value/10;
        return convertEthToUsd(price + percentChange);
    }, [data])

    const price2IfWin = useMemo(() => {
        const price = character2?.price;
        const percentChange = character2?.value/10;
        return convertEthToUsd(price + percentChange);
    }, [data])

    const price1IfLoss = useMemo(() => {
        const price = character1?.price;
        const percentChange = character1?.value/10;
        return convertEthToUsd(price - percentChange);
    }, [data])

    const price2IfLoss = useMemo(() => {
        const price = character2?.price;
        const percentChange = character2?.value/10;
        return convertEthToUsd(price - percentChange);
    }, [data])

    console.log("data will start at", data?.willStartAt)
    const willStartIn = useTimeTill(data?.willStartAt ?? 0);

    return (
        <Card className="world-state-card bg-dark w-100">
            <Card.Body className="w-100">
                <Row className="align-items-center text-center w-100 justify-content-evenly">
                    <Col className='flex flex-col justify-content-start'>
                        <h4 className="">
                            {character1?.name}
                        </h4>
                        <p className="text-light">MarketCap: ${convertEthToUsd(character1?.value)}</p>
                        {!winner && <>
                            <h6 className="if-result">Win: Share price ${price1IfWin}</h6>
                        </>}
                        {winner && winner == character1?.id && <h6 className="if-result">Won. Price now ${price1IfWin}</h6>}
                        {winner && winner == character2?.id && <h6 className="if-result-loss">Lost. Price now ${price1IfLoss}</h6>}
                        
                    </Col>
                    <Col className="">
                        <p className="next-match">{isPendingMAtch && `Match starting in ${willStartIn}S`}</p>
                        <h4 className="vs-text">VS</h4>
                    </Col>
                    <Col className="">
                        <h4 className="">
                            {character2?.name}
                        </h4>
                        <p className="text-light">MarketCap: ${convertEthToUsd(character2?.value)}</p>
                        {!winner && <>
                            <h6 className="if-result">Win: Share Price ${price2IfWin}</h6>
                        </>}
                        {winner && winner == character2?.id && <h6 className="if-result">Won. Price now ${price2IfWin}</h6>}
                        {winner && winner == character1?.id && <h6 className="if-result-loss">Lost. Price now ${price2IfLoss}</h6>}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};
