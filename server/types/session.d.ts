import 'express-session';

declare module 'express-session' {
  interface SessionData {
    gmailTokens?: {
      access_token: string;
      refresh_token: string;
      scope: string;
      token_type: string;
      expiry_date?: number;
    };
  }
}