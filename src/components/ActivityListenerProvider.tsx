import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';
import { BaseActivity } from '@memeclashtv/types/activity';
import { initActivities } from '../hooks/api';
import { usePrivy } from '@privy-io/react-auth';

interface ActivityContextType {
  activities: BaseActivity[];
  sendMessage: (message: string) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken, authenticated } = usePrivy();
  const [activities, setActivities] = useState<BaseActivity[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    initActivities(100).then(setActivities);
  }, []);

  useEffect(() => {
    if (authenticated) {
      getAccessToken().then(setAuthToken);
    }
  }, [authenticated]);

  // WebSocket URL
  const socketUrl = import.meta.env.VITE_WS_API_URL as string;

  // Use the useWebSocket hook to connect to the WebSocket
  const { lastMessage, sendMessage } = useWebSocket(socketUrl, {
    onMessage: (message) => console.log('WebSocket message received:', message),
    onOpen: () => console.log('WebSocket connection opened'),
    onClose: () => console.log('WebSocket connection closed'),
    onError: (error) => console.error('WebSocket error:', error),
    shouldReconnect: () => true, // Will attempt to reconnect on all close events
  });

  const trueSendMessage = useCallback(async (message: string) => {
    if (!authenticated || !authToken) {
      return;
    }
    
    const msg = {
      message: message,
      authToken: authToken,
    }
    sendMessage(JSON.stringify(msg));
    console.log('sent message', JSON.stringify(msg));
  }, [sendMessage, authToken, authenticated]);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage !== null) {
      console.log('received message', lastMessage);
      setActivities(prevActivities => {
        const activitiesArray = Array.isArray(prevActivities) ? prevActivities : [];
        return [JSON.parse(lastMessage.data), ...activitiesArray];
      });
    }
  }, [lastMessage]);

  return (
    <ActivityContext.Provider value={{ activities, sendMessage: trueSendMessage }}>
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

export const useSendMessage = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useSendMessage must be used within an ActivityProvider');
  }
  return context.sendMessage;
}
