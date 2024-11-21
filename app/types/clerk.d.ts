import { AuthObject } from '@clerk/nextjs/dist/types/server';
import { NextRequest } from 'next/server';

declare module '@clerk/nextjs' {
  interface AuthMiddlewareParams {
    publicRoutes?: string[];
    afterAuth?(
      auth: AuthObject,
      req: NextRequest,
    ): Promise<Response | void> | Response | void;
  }
} 