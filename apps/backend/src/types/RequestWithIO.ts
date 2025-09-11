import { Server as SocketIOServer } from 'socket.io';
import { Request } from 'express';

export interface RequestWithIO extends Request {
  io?: SocketIOServer;
}
