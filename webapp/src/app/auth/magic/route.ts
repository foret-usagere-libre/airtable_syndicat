import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUserByMagicToken, isUserActive } from "@/lib/airtable";
import { createSessionToken, getSessionConfig } from "@/lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(new URL("/acces?reason=missing-token", request.url));
  }

  const user = await getUserByMagicToken(token);
  if (!user || !isUserActive(user.status)) {
    return NextResponse.redirect(new URL("/acces?reason=forbidden", request.url));
  }

  const { token: sessionToken, expiresAt } = await createSessionToken({
    userId: user.id,
    email: user.email,
    nom: user.nom,
  });
  const { cookieName, ttlSeconds } = getSessionConfig();

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL("/", request.url));
}
