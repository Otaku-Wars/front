import { useNavigate } from 'react-router-dom';
import { Image } from 'react-bootstrap';

import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import './CharacterList.css'; // Import your custom styles
import { Character } from "@memeclashtv/types"
import { useCharacterPerformance, useCharacters } from "../hooks/api";

const cutText = (text, maxLength) => {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '..';
    }
    return text;
};

export const formatFloat = (x, f) => {
    return Number.parseFloat(x).toExponential(f);
};

export const convertEthToUsd = (eth) => {
    const rate = 2656.84;
    return (eth * rate).toFixed(2);
}


export const CharacterListItem = ({ character }: { character: Character }) => {
    const yesterday = (new Date().getTime()/ 1000) - 86400;
    const { data: performance, isLoading, isError } = useCharacterPerformance(character.id, yesterday);
    const navigate = useNavigate();
    console.log("performance found", performance)

    const handleClick = () => {
        navigate(`/character/${character.id}`);
    };

    return (
        <ListGroup.Item className="character-list-item bg-dark text-white" onClick={handleClick}>
            <div className="character-list-item-identity">
                <Image
                    src={character?.pfp}
                    alt={"Hi"}
                    height={41}
                    width={41}
                    className="character-list-item-avatar"
                />
                <p className="character-list-item-name">{cutText(character?.name, 8)}</p>
            </div>
            <p className="character-list-item-price">${convertEthToUsd(character?.value) ?? "0"}</p>
            <p className="character-list-item-price">${convertEthToUsd(character?.price) ?? "0"}</p>
            <p className={"character-list-item-price " + (performance >= 0 ? "text-success" : "text-danger")}>{
                (isLoading && performance == undefined) ? "Loading..." : isError ? "Error" : `%${performance.toFixed(2)}`
            }</p>
        </ListGroup.Item>
    );
}



export const CharacterList = () => {
    const { data: characters, isLoading, isError } = useCharacters();

    const navigate = useNavigate();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error</div>;
    }

    const handleCharacterClick = (characterName: string) => {
        navigate(`/character/${characterName}`);
    };

    return (
        <Card className="character-card h-100 w-100 d-flex flex-column bg-dark">
            <Card.Header className="character-list-header">
                Characters
            </Card.Header>
            <div className="character-list-container flex-grow-1 d-flex flex-column overflow-auto">
                <ListGroup variant="flush" className="flex-grow-1 flex-column">
                    {characters
                        .sort((a, b) => b.value - a.value)
                        .map((character: any, index: number) => (
                            <CharacterListItem key={index} character={character} />
                        ))}
                </ListGroup>
            </div>
        </Card>
    );
};

