import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const isConnecting = useRef(false);

  useEffect(() => {
    if (isConnecting.current || socket?.connected) return;

    isConnecting.current = true;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      isConnecting.current = false;
      return;
    }

    socket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      isConnecting.current = false;
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      isConnecting.current = false;
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      isConnecting.current = false;
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setIsConnected(false);
      isConnecting.current = false;
    };
  }, []);

const subscribe = <T>(event: string, callback: (data: T) => void) => {
    if (!socket) return () => {};
    const s = socket;
    s.on(event, callback);
    return () => s.off(event, callback);
  };

  return { socket, isConnected, subscribe };
}