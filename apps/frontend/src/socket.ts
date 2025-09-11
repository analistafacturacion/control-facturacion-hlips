import { io, Socket } from 'socket.io-client';
import API_CONFIG from './config/api';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    // Remover /api del final para socket.io
    const socketURL = API_CONFIG.BASE_URL.replace('/api', '');
    socket = io(socketURL, {
      transports: ['websocket'],
    });
  }
  return socket;
}
