// Deno runtime types
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

// Module declarations for Supabase Edge Function imports
declare module "std/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "supabase-js" {
  export function createClient(url: string, key: string, options?: any): any;
}
