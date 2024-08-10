import ListGroup from 'react-bootstrap/ListGroup';
import Card from 'react-bootstrap/Card';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';  // Import useNavigate
import { apiUrl } from "../main";

export const CharacterList = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['worldState'],
        queryFn: async () => {
            const response = await fetch(`${apiUrl}/world`);
            return response.json();
        },
        refetchInterval: 1000,
    });

    const navigate = useNavigate();  // Initialize useNavigate

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error</div>;
    }

    // Function to handle click and navigate to the character page
    const handleCharacterClick = (characterName: string) => {
        navigate(`/character/${characterName}`);
    };

    return (
        <Card className="character-list-card">
            <Card.Header className="text-center text-warning bg-dark">
                Characters
            </Card.Header>
            <ListGroup variant="flush">
                {data?.characters.map((character: any, index: number) => (
                    <ListGroup.Item
                        key={index}
                        className="character-list-item d-flex justify-content-between bg-dark"
                        onClick={() => handleCharacterClick(character.name)}  // Navigate on click
                        style={{ cursor: 'pointer' }}  // Change cursor to pointer to indicate clickable item
                    >
                        <span className="text-warning">{index + 1}.</span>
                        <span className="text-white">{character?.name ?? "Name undefined"}</span>
                        <span className="text-warning">{character?.value ?? "0"} ETH</span>
                        <span className="text-warning">{character?.supply ?? "TVL undefined"} Tokens</span>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
};
