import { Auth0Client } from "@auth0/nextjs-auth0/server";

const domain =
  process.env.AUTH0_DOMAIN ||
  (process.env.AUTH0_ISSUER_BASE_URL || "").replace(/^https?:\/\//, "").replace(/\/$/, "") ||
  undefined;

export const auth0 = new Auth0Client({
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
    accessToken: "/api/auth/access-token",
  } as any,
});

export const getSession = (req?: Request, res?: Response) => {
  if (!req && !res) return auth0.getSession();
  return auth0.getSession(req as any, res as any);
};
export const withApiAuthRequired = (handler: any) => auth0.withApiAuthRequired(handler);
export const updateSession = (req: any, res: any, sessionData: any) => auth0.updateSession(req, res, sessionData);
