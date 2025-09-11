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

declare module 'typeorm' {
  export function createConnection(options?: any): Promise<any>;
  export function getRepository(target: any): any;
  export function getConnection(): any;
  export class Entity {}
  export class PrimaryGeneratedColumn {}
  export class Column {}
  export class CreateDateColumn {}
  export class UpdateDateColumn {}
  export class ManyToOne {}
  export class OneToMany {}
  export class JoinColumn {}
}
