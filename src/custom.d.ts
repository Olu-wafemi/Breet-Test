declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    keyid?: string;
  }

  export type Secret = string | Buffer;

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string;

  export function verify(token: string, secretOrPublicKey: Secret, options?: object): any;
  
  export function decode(token: string, options?: object): any;
} 