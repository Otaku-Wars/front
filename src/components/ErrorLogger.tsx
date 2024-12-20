import React, { useEffect, useState, useRef } from 'react';

interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  stack?: string;
}

type LogFilter = 'all' | LogEntry['type'];

// Custom serializer to handle BigInt
const customStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (_, value) => {
      if (typeof value === 'bigint') return value.toString() + 'n';
      if (value instanceof Error) return `[Error: ${value.message}]`;
      if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
      if (value instanceof Promise) return '[Promise]';
      if (value instanceof Map) return `Map(${value.size})`;
      if (value instanceof Set) return `Set(${value.size})`;
      if (value === undefined) return 'undefined';
      if (value === null) return 'null';
      if (Number.isNaN(value)) return 'NaN';
      return value;
    }, 2);
  } catch (err) {
    return String(obj);
  }
};

// Helper to safely convert any value to string
const safeToString = (arg: any): string => {
  try {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    if (typeof arg === 'bigint') return arg.toString() + 'n';
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
    }
    if (Array.isArray(arg)) {
      return `[${arg.map(item => safeToString(item)).join(', ')}]`;
    }
    if (typeof arg === 'object') {
      return customStringify(arg);
    }
    return String(arg);
  } catch (err) {
    return `[Unable to stringify: ${typeof arg}]`;
  }
};

const getLogStyles = (type: LogEntry['type']) => {
  const baseStyles = {
    padding: '4px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    borderLeft: '4px solid',
  };

  switch (type) {
    case 'error':
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderLeftColor: '#ff4444',
        color: '#ff6666',
      };
    case 'warn':
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 166, 0, 0.1)',
        borderLeftColor: '#ffaa00',
        color: '#ffcc00',
      };
    case 'info':
      return {
        ...baseStyles,
        backgroundColor: 'rgba(0, 170, 255, 0.1)',
        borderLeftColor: '#00aaff',
        color: '#66ccff',
      };
    case 'debug':
      return {
        ...baseStyles,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderLeftColor: '#888',
        color: '#aaa',
      };
    default:
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderLeftColor: '#888',
        color: '#ffffff',
      };
  }
};

const FilterButton = ({ type, active, onClick, count }: { 
  type: LogFilter; 
  active: boolean; 
  onClick: () => void;
  count: number;
}) => (
  <button
    onClick={onClick}
    style={{
      background: active ? 'rgba(255, 255, 255, 0.1)' : 'none',
      border: '1px solid ' + (active ? '#666' : '#444'),
      color: active ? '#fff' : '#888',
      cursor: 'pointer',
      padding: '4px 8px',
      marginRight: '8px',
      fontSize: '11px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }}
  >
    {type.charAt(0).toUpperCase() + type.slice(1)}
    <span style={{
      background: active ? '#666' : '#444',
      padding: '2px 6px',
      borderRadius: '10px',
      fontSize: '10px',
    }}>
      {count}
    </span>
  </button>
);

export function ErrorLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LogFilter>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Process early logs
  useEffect(() => {
    if (window.__LOG_BUFFER__) {
      const earlyLogs = window.__LOG_BUFFER__.map((log: any) => ({
        type: log.type as LogEntry['type'],
        message: log.args.map(safeToString).join(' '),
        timestamp: new Date(log.timestamp),
        stack: log.stack
      }));
      
      setLogs(prev => [...earlyLogs, ...prev]);
      window.__LOG_BUFFER__ = null; // Clear the buffer
    }
  }, []);

  useEffect(() => {
    // Get the original console methods from our global storage
    const originalConsole = window.__ORIGINAL_CONSOLE__ || {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
      trace: console.trace,
    };

    // Create log handler
    const createLogHandler = (type: LogEntry['type']) => (...args: any[]) => {
      originalConsole[type]?.(...args);
      setLogs(prev => [...prev, {
        type,
        message: args.map(safeToString).join(' '),
        timestamp: new Date(),
        stack: new Error().stack?.split('\n').slice(2).join('\n') // Capture stack trace
      }]);
    };

    // Override all console methods
    console.log = createLogHandler('log');
    console.error = createLogHandler('error');
    console.warn = createLogHandler('warn');
    console.info = createLogHandler('info');
    console.debug = createLogHandler('debug');
    console.trace = createLogHandler('debug');

    // Handle uncaught errors and unhandled rejections
    const errorHandler = (event: ErrorEvent | PromiseRejectionEvent) => {
      const isErrorEvent = event instanceof ErrorEvent;
      const error = isErrorEvent ? event.error : event.reason;
      
      setLogs(prev => [...prev, {
        type: 'error',
        message: isErrorEvent 
          ? event.message
          : `Unhandled Promise Rejection: ${safeToString(error)}`,
        stack: error?.stack || new Error().stack,
        timestamp: new Date()
      }]);
    };

    // Handle console.assert failures
    const originalAssert = console.assert;
    console.assert = (condition: boolean, ...args: any[]) => {
      originalAssert(condition, ...args);
      if (!condition) {
        setLogs(prev => [...prev, {
          type: 'error',
          message: `Assertion failed: ${args.map(safeToString).join(' ')}`,
          timestamp: new Date(),
          stack: new Error().stack
        }]);
      }
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', errorHandler);

    // Cleanup
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      console.trace = originalConsole.trace;
      console.assert = originalAssert;
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
    };
  }, []); // Empty dependency array to only run once on mount

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter(log => 
    activeFilter === 'all' || log.type === activeFilter
  );

  const logCounts = logs.reduce((acc, log) => {
    acc[log.type] = (acc[log.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        top: isFullscreen ? 0 : 'auto',
        height: isFullscreen ? '100vh' : (isCollapsed ? '32px' : '300px'),
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        zIndex: 9999,
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '4px 8px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            Console ({filteredLogs.length} logs)
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <FilterButton 
              type="all" 
              active={activeFilter === 'all'} 
              onClick={() => setActiveFilter('all')}
              count={logs.length}
            />
            <FilterButton 
              type="error" 
              active={activeFilter === 'error'} 
              onClick={() => setActiveFilter('error')}
              count={logCounts.error || 0}
            />
            <FilterButton 
              type="warn" 
              active={activeFilter === 'warn'} 
              onClick={() => setActiveFilter('warn')}
              count={logCounts.warn || 0}
            />
            <FilterButton 
              type="info" 
              active={activeFilter === 'info'} 
              onClick={() => setActiveFilter('info')}
              count={logCounts.info || 0}
            />
            <FilterButton 
              type="debug" 
              active={activeFilter === 'debug'} 
              onClick={() => setActiveFilter('debug')}
              count={logCounts.debug || 0}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearLogs}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff4444',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {isFullscreen ? '⊽' : '⊿'}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>
      <div 
        style={{ 
          padding: '8px', 
          display: isCollapsed ? 'none' : 'block',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {filteredLogs.map((log, index) => (
          <div
            key={index}
            style={getLogStyles(log.type)}
          >
            <span style={{ opacity: 0.7, fontSize: '11px' }}>
              [{log.timestamp.toLocaleTimeString()}]
            </span>
            {' '}
            <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              {log.message}
            </span>
            {log.stack && (
              <div style={{ 
                marginTop: '4px', 
                fontSize: '11px', 
                opacity: 0.7,
                paddingLeft: '8px',
                borderLeft: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                {log.stack}
              </div>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
} 

// Add TypeScript declarations
declare global {
  interface Window {
    __LOG_BUFFER__: Array<{
      type: string;
      args: any[];
      timestamp: string;
      stack?: string;
    }> | null;
    __ORIGINAL_CONSOLE__: {
      log: typeof console.log;
      error: typeof console.error;
      warn: typeof console.warn;
      info: typeof console.info;
      debug: typeof console.debug;
      trace: typeof console.trace;
    };
  }
} 