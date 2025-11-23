// Minimal module shims to silence TypeScript errors in the editor when deps are not installed
declare module 'express';
declare module 'cors';
declare module 'body-parser';
declare module 'dotenv';
declare module '@prisma/client';
declare module 'ethers';

// Provide minimal Node globals for the TS server when @types/node isn't installed
declare var process: any;
declare var global: any;

export {};
