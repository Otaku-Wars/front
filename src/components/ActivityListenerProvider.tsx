import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { BaseActivity } from '@memeclashtv/types/activity';
import { initActivities } from '../hooks/api';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useMediaQuery } from '../hooks/use-media-query';

interface ActivityContextType {
  activities: BaseActivity[];
  sendMessage: (message: string) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken, authenticated } = usePrivy();
  const [activities, setActivities] = useState<BaseActivity[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 1100px)');

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

  // Ensure WebSocket URL has correct protocol
  const getWebSocketUrl = useCallback(() => {
    try {
      const url = new URL(socketUrl);
      // Force WSS for production and Safari
      if (url.protocol === 'http:' || /^(iPhone|iPad|iPod|Safari)/.test(navigator.userAgent)) {
        url.protocol = 'wss:';
      } else if (url.protocol === 'https:') {
        url.protocol = 'wss:';
      } else if (url.protocol === 'ws:' || url.protocol === 'wss:') {
        // Keep existing WebSocket protocol
        return socketUrl;
      }
      return url.toString();
    } catch (e) {
      console.error('Invalid WebSocket URL:', e);
      return socketUrl;
    }
  }, [socketUrl]);

  // Use the useWebSocket hook to connect to the WebSocket
  const { lastMessage, sendMessage } = useWebSocket(getWebSocketUrl(), {
    onMessage: (message) => console.log('WebSocket message received:', message),
    onOpen: () => console.log('WebSocket connection opened'),
    onClose: () => console.log('WebSocket connection closed'),
    onError: (error) => {
      console.error('WebSocket error:', error);
      // Add specific error handling for Safari
      if (/^(iPhone|iPad|iPod|Safari)/.test(navigator.userAgent)) {
        console.log('Safari detected, attempting to reconnect with WSS');
      }
    },
    shouldReconnect: (closeEvent) => {
      // Don't reconnect on specific close codes that indicate permanent failure
      if (closeEvent.code === 1008 || closeEvent.code === 1011) return false;
      return true;
    },
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    retryOnError: true,
  });

  const trueSendMessage = useCallback(async (message: string) => {
    if (!authenticated || !authToken || isMobile) {
      return;
    }
    
    const msg = {
      message: message,
      authToken: authToken,
    }
    sendMessage(JSON.stringify(msg));
    console.log('sent message', JSON.stringify(msg));
  }, [sendMessage, authToken, authenticated, isMobile]);

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
    <ActivityContext.Provider value={{ activities, sendMessage: isMobile ? null : trueSendMessage }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useCheckNewActivities = () => {
  const activities = useActivities();
  const queryClient = useQueryClient();
  
  const lastRefetchTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevActivityCountRef = useRef<number>(activities.length);

  useEffect(() => {
    const hasNewActivities = activities.length > prevActivityCountRef.current;

    if (hasNewActivities) {
      const now = Date.now();
      const elapsed = now - lastRefetchTimeRef.current;
      const MIN_INTERVAL = 5000; // 5 seconds

      if (elapsed >= MIN_INTERVAL) {
        // If enough time has passed, refetch immediately
        queryClient.invalidateQueries();
        lastRefetchTimeRef.current = now;
      } else {
        // Otherwise, schedule a refetch after the remaining time
        if (!timeoutRef.current) {
          const remainingTime = MIN_INTERVAL - elapsed;
          timeoutRef.current = setTimeout(() => {
            queryClient.invalidateQueries();
            lastRefetchTimeRef.current = Date.now();
            timeoutRef.current = null;
          }, remainingTime);
        }
      }

      // Update the previous activity count
      prevActivityCountRef.current = activities.length;
    }
  }, [activities, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
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
