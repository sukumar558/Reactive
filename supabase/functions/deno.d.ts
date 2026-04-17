declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

declare interface Request {
  method: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare interface Response {
  new(body?: any, init?: any): Response;
  headers: any;
  status: number;
}
