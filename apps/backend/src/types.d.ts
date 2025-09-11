// Global type declarations for Node.js environment
declare const require: any;
declare const process: any;
declare const __dirname: string;
declare const __filename: string;
declare const global: any;
declare const Buffer: any;

// Module declarations for packages without types
declare module 'exceljs' {
  const Excel: any;
  export = Excel;
}

declare module 'node-fetch' {
  const fetch: any;
  export = fetch;
}

declare module 'socket.io' {
  export const Server: any;
  export const Socket: any;
}

declare module 'bcryptjs' {
  export function hash(data: any, saltOrRounds: any): Promise<string>;
  export function compare(data: any, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secretOrPrivateKey: any, options?: any): string;
  export function verify(token: string, secretOrPublicKey: any, options?: any): any;
  export function decode(token: string, options?: any): any;
}

declare module 'express' {
  export interface Request {
    body?: any;
    query?: any;
    params?: any;
    headers?: any;
  }
  export interface Response {
    status(code: number): Response;
    json(obj: any): Response;
    send(body?: any): Response;
  }
  export interface NextFunction {
    (err?: any): void;
  }
  export const Router: any;
  export default function express(): any;
}

declare module 'typeorm' {
  export function createConnection(options?: any): Promise<any>;
  export function getRepository(target: any): any;
  export function getConnection(): any;
  export function Between(from: any, to: any): any;
  
  // Decorators as functions
  export function Entity(name?: string): (target: any) => void;
  export function PrimaryGeneratedColumn(options?: any): (target: any, propertyKey: string) => void;
  export function Column(options?: any): (target: any, propertyKey: string) => void;
  export function CreateDateColumn(options?: any): (target: any, propertyKey: string) => void;
  export function UpdateDateColumn(options?: any): (target: any, propertyKey: string) => void;
  export function ManyToOne(typeFunctionOrTarget?: any, inverseSide?: any, options?: any): (target: any, propertyKey: string) => void;
  export function OneToMany(typeFunctionOrTarget?: any, inverseSide?: any, options?: any): (target: any, propertyKey: string) => void;
  export function JoinColumn(options?: any): (target: any, propertyKey: string) => void;
}
