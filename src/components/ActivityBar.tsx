import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import './ActivityBar.css'; // Import your custom styles

export const ActivityBar = () => {
    const [activities, setActivities] = useState<string[]>([]);
    
    // WebSocket URL
    const socketUrl = import.meta.env.VITE_WS_API_URL as string;

    // Use the useWebSocket hook to connect to the WebSocket
    const { lastMessage } = useWebSocket(socketUrl, {
        onMessage: (message) => console.log('WebSocket message received:', message),
        onOpen: () => console.log('WebSocket connection opened'),
        onClose: () => console.log('WebSocket connection closed'),
        onError: (error) => console.error('WebSocket error:', error),
        shouldReconnect: () => true, // Will attempt to reconnect on all close events
    });

    // Handle incoming messages
    useEffect(() => {
        if (lastMessage !== null) {
            setActivities(prevActivities => [lastMessage.data, ...prevActivities]);
        }
    }, [lastMessage]);

    return (
        <Card className="activity-card h-100 w-100 d-flex flex-column bg-dark">
            <Card.Header className="activity-header">
                Activity
            </Card.Header>
            <div className="activity-list-container flex-grow-1 d-flex flex-column-reverse overflow-auto">
                <ListGroup variant="flush" className="flex-grow-1 flex-column-reverse">
                    {activities.map((activity, index) => (
                        <ListGroup.Item key={index} className="activity-list-item bg-dark text-white">
                            {activity}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        </Card>
    );
};
