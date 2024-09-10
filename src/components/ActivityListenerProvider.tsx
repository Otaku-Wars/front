import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { BaseActivity } from '@memeclashtv/types/activity';

interface ActivityContextType {
  activities: BaseActivity[];
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<BaseActivity[]>([]);

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
      setActivities(prevActivities => [JSON.parse(lastMessage.data), ...prevActivities]);
    }
  }, [lastMessage]);

  return (
    <ActivityContext.Provider value={{ activities }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context.activities;
};
