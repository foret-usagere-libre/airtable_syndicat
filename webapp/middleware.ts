import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionConfig, needsRevalidation, verifySessionToken } from "@/lib/session";
import { getUserStatusById, isUserActive } from "@/lib/airtable";

const PUBLIC_PATHS = ["/auth/magic", "/acces"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const { cookieName, ttlSeconds } = getSessionConfig();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/acces?reason=missing-session", request.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/acces?reason=expired", request.url));
  }

  if (!needsRevalidation(session)) {
    return NextResponse.next();
  }

  // Session est encore signee/valide mais son dernier controle Airtable date
  // de plus de REVALIDATE_INTERVAL_SECONDS : on revalide le statut du compte.
  // Airtable fait autorite, pas l'horloge du cookie.
  let status: string | null;
  try {
    status = await getUserStatusById(session.userId);
  } catch {
    // Panne Airtable transitoire : on ne coupe pas l'acces, le cookie
    // signe reste valable jusqu'a son expiration et on retentera au
    // prochain passage.
    return NextResponse.next();
  }

  if (!status || !isUserActive(status)) {
    const response = NextResponse.redirect(new URL("/acces?reason=expired", request.url));
    response.cookies.delete(cookieName);
    return response;
  }

  const { token: refreshedToken, expiresAt } = await createSessionToken({
    userId: session.userId,
    email: session.email,
    nom: session.nom,
  });

  const response = NextResponse.next();
  response.cookies.set(cookieName, refreshedToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttlSeconds,
    expires: expiresAt,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
