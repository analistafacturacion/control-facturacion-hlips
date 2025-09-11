import { Server } from 'socket.io';
import { Request } from 'express';

export interface RequestWithIO extends Request {
  io?: InstanceType<typeof Server>;
}
