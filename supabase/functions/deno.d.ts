/**
 * Deno Type Definitions for Supabase Edge Functions
 * 
 * This file provides type declarations for Deno runtime APIs used in Edge Functions.
 * VSCode/TypeScript will use these to provide IntelliSense without errors.
 */

// Declare Deno namespace for type checking
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  
  const env: Env;
  
  function test(name: string, fn: () => void | Promise<void>): void;
  function test(options: { name: string; fn: () => void | Promise<void> }): void;
}

// Declare global crypto for UUID generation (available in Deno)
declare interface Crypto {
  randomUUID(): string;
}
