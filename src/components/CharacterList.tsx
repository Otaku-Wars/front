import { useQuery } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { apiUrl } from "../main";
import { Image } from 'react-bootstrap';

// export const CharacterList = () => {
//     const { data, isLoading, isError } = useQuery({
//         queryKey: ['worldState'],
//         queryFn: async () => {
//             const response = await fetch(`${apiUrl}/world`);
//             return response.json();
//         },
//         refetchInterval: 1000,
//     });

//     const navigate = useNavigate();

//     if (isLoading) {
//         return <div>Loading...</div>;
//     }

//     if (isError) {
//         return <div>Error</div>;
//     }

//     const handleCharacterClick = (characterName: string) => {
//         navigate(`/character/${characterName}`);
//     };

//     return (
//         <Card className="character-list h-100 w-100 d-flex flex-column bg-dark">
//             <Card.Header className="character-list-header">
//                 Characters
//             </Card.Header>
//             <div className="character-list-container flex-grow-1 d-flex flex-column-reverse overflow-auto">
//                 <ListGroup variant="flush">
//                     {data?.characters.map((character: any, index: number) => (
//                         <ListGroup.Item
//                             key={index}
//                             className="character-list-item bg-dark"
//                             onClick={() => handleCharacterClick(character.name)}
//                             style={{ cursor: 'pointer' }}
//                         >
//                             <div className="d-flex align-items-center">
//                                 <span className="text-warning me-2">{index + 1}.</span>
//                                 <Image
//                                     src={character?.pfp}
//                                     alt={character?.name}
//                                     height={40}
//                                     width={40}
//                                     rounded
//                                     className="me-2"
//                                 />
//                                 <span className="text-white">{character?.name ?? "Name undefined"}</span>
//                             </div>
//                             <span className="text-success align-self-center">{character?.price ?? "0"} ETH</span>
//                         </ListGroup.Item>
//                     ))}
//                 </ListGroup>
//             </div>
//         </Card>
//     );
// };



import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import './CharacterList.css'; // Import your custom styles

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


export const CharacterList = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`);
            return response.json();
        },
        refetchInterval: 1000,
    });

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
                    {data?.characters.map((character, index) => (
                        <ListGroup.Item 
                            key={index} 
                            className="character-list-item bg-dark text-white"
                            onClick={() => handleCharacterClick(character.name)}
                            >
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
                            <p className="character-list-item-price">${convertEthToUsd(character?.price) ?? "0"}</p>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        </Card>
    );
};

