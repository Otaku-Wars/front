import React, { useEffect, useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import useWebSocket from 'react-use-websocket';
import './ActivityBar.css'; // Import your custom styles

export const ActivityBar = () => {
    const [activities, setActivities] = useState<string[]>([]);
    
    // WebSocket URL
    const socketUrl = 'ws://localhost:3000/ws';

    // Use the useWebSocket hook to connect to the WebSocket
    const { lastMessage, sendMessage } = useWebSocket(socketUrl, {
        onOpen: () => console.log('WebSocket connection opened'),
        onClose: () => console.log('WebSocket connection closed'),
        onError: (error) => console.error('WebSocket error:', error),
        onMessage: (message) => console.log('WebSocket message:', message),
        shouldReconnect: (closeEvent) => true, // Will attempt to reconnect on all close events
    });

    // Handle incoming messages
    useEffect(() => {
        if (lastMessage !== null) {
            setActivities(prevActivities => [...prevActivities, lastMessage.data]);
        }
    }, [lastMessage]);

    return (
        <Card className="activity-card">
            <Card.Header className="text-center text-warning bg-dark">
                Activity
            </Card.Header>
            <div className="activity-list-container">
                <ListGroup variant="flush">
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
