import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionData {
  isAdmin?: boolean;
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "default-secret-change-me-in-production-32chars",
  cookieName: "mha-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}
