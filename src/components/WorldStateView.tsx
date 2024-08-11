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

    console.log("data will start at", data?.willStartAt)
    const willStartIn = useTimeTill(data?.willStartAt ?? 0);

    return (
        <Card className="world-state-card bg-dark w-100">
            <Card.Body className="w-100">
                <Row className="align-items-center text-center flex-grow-1 w-100">
                    <Col>
                        <h5 className="text-light">
                            <span className="mr-2 text-warning">
                                <Image
                                    src={character1?.pfp}
                                    alt={character1?.name}
                                    height={50}
                                    width={50}
                                    className='mr-10 px-10'
                                    rounded
                                />
                            </span>
                            {character1?.name}
                        </h5>
                        <p className="text-light">MarketCap: {character1?.value} ETH</p>
                        {!winner && <>
                            <p className="text-success">If it wins, gain {character1Loss} ETH ➔</p>
                            <p className="text-danger">If it loses, pay {character1Loss} ETH ➔</p>
                        </>}
                        {winner && winner == character1?.id && <h4 className="text-success">Won {character1Loss} ETH</h4>}
                        {winner && winner == character2?.id && <h4 className="text-danger">Lost {character1Loss} ETH</h4>}
                        
                    </Col>
                    <Col className="vs-text">
                        {isPendingMAtch && <h4 className="text-warning">Match starting in {willStartIn} seconds</h4> }
                        <h4 className="text-warning">VS</h4>
                    </Col>
                    <Col>
                        <h5 className="text-light">
                            <span className="mr-2 text-warning">
                                <Image
                                    src={character2?.pfp}
                                    alt={character2?.name}
                                    height={50}
                                    width={50}
                                    rounded
                                />
                            </span>
                            {character2?.name}
                        </h5>
                        <p className="text-light">MarketCap: {character2?.value} ETH</p>
                        {!winner && <>
                            <p className="text-success">If it wins, gain {character2Loss} ETH ➔</p>
                            <p className="text-danger">If it loses, pay {character2Loss} ETH ➔</p>
                        </>}
                        {winner && winner == character2?.id && <h4 className="text-success">Won {character2Loss} ETH</h4>}
                        {winner && winner == character1?.id && <h4 className="text-danger">Lost {character2Loss} ETH</h4>}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};
