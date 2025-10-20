import { useState, useEffect, useRef, useCallback } from 'react';

// The number of measurements to take to get a stable average clock offset.
const MAX_NTP_MEASUREMENTS = 40;

/**
 * Implements a high-precision clock synchronization mechanism inspired by NTP
 * to calculate and maintain an accurate estimate of the clock difference
 * between this client and the server.
 */
export const useNtpSync = (ws: React.MutableRefObject<WebSocket | null>) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [estimatedOffset, setEstimatedOffset] = useState(0);
  const measurementsRef = useRef<{ offset: number; rtt: number }[]>([]);
  const syncIterationsRef = useRef(0);
  const syncPromiseResolveRef = useRef<((offset: number) => void) | null>(null);

  const sendNtpRequest = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'NTP_REQUEST',
        T0: performance.timeOrigin + performance.now() // High-precision client send time
      }));
    }
  }, [ws]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'NTP_RESPONSE') return;

        const T3 = performance.timeOrigin + performance.now(); // T3: Client receipt time
        const { T0, T1, T2 } = data; // T0: client sent, T1: server received, T2: server sent

        // Round-Trip Time (RTT) / Network Latency
        const rtt = (T3 - T0) - (T2 - T1);
        // Clock Offset (how far ahead/behind the server clock we are)
        const offset = ((T1 - T0) + (T2 - T3)) / 2;
        
        measurementsRef.current.push({ offset, rtt });

        // Maintain a rolling window of the last N measurements for stability
        if (measurementsRef.current.length > MAX_NTP_MEASUREMENTS) {
          measurementsRef.current.shift();
        }
        
        // Calculate the running average offset to smooth out network jitter
        const totalOffset = measurementsRef.current.reduce((acc, m) => acc + m.offset, 0);
        const avgOffset = totalOffset / measurementsRef.current.length;
        setEstimatedOffset(avgOffset);

        syncIterationsRef.current++;

        if (syncIterationsRef.current < MAX_NTP_MEASUREMENTS) {
          // Send the next request immediately for rapid initial stabilization
          sendNtpRequest();
        } else {
          // We have a stable value, the sync process is complete.
          setIsSyncing(false);
          if (syncPromiseResolveRef.current) {
            syncPromiseResolveRef.current(avgOffset);
            syncPromiseResolveRef.current = null;
          }
        }
      } catch (error) {
        console.error("Error processing NTP response:", error);
        setIsSyncing(false);
         if (syncPromiseResolveRef.current) {
            syncPromiseResolveRef.current(0); // Resolve with 0 on error
            syncPromiseResolveRef.current = null;
        }
      }
    };
    
    const socket = ws.current;
    socket?.addEventListener('message', handleMessage);
    return () => {
      socket?.removeEventListener('message', handleMessage);
    };
  }, [ws, sendNtpRequest]);
  
  const startSync = useCallback(() => {
    return new Promise<number>((resolve) => {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        console.error("Cannot start NTP sync: WebSocket is not open.");
        resolve(0); // Resolve immediately with 0 if connection isn't ready
        return;
      }
      setIsSyncing(true);
      measurementsRef.current = [];
      syncIterationsRef.current = 0;
      syncPromiseResolveRef.current = resolve;
      sendNtpRequest(); // Start the first request
    });
  }, [sendNtpRequest, ws]);

  return { isSyncing, estimatedOffset, startSync };
};
