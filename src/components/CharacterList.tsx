import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { apiUrl } from "../main";
import { Image } from 'react-bootstrap';

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
        <Card className="character-list-card h-100 w-100 d-flex flex-column flex-grow-1">
            <Card.Header className="text-center text-warning bg-dark character-list-header">
                Characters
            </Card.Header>
            <ListGroup variant="flush" className="flex-grow-1 overflow-auto character-list">
                {data?.characters.map((character: any, index: number) => (
                    <ListGroup.Item
                        key={index}
                        className="character-list-item d-flex justify-content-between bg-dark"
                        onClick={() => handleCharacterClick(character.name)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="d-flex align-items-center">
                            <span className="text-warning me-2">{index + 1}.</span>
                            <Image
                                src={character?.pfp}
                                alt={character?.name}
                                height={40}
                                width={40}
                                rounded
                                className="me-2"
                            />
                            <span className="text-white">{character?.name ?? "Name undefined"}</span>
                        </div>
                        <span className="text-success align-self-center">{character?.price ?? "0"} ETH</span>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
};
