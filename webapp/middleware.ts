import { NextRequest, NextResponse } from "next/server";
import { getSessionConfig, verifySessionToken } from "@/lib/session";

const PUBLIC_PATHS = ["/auth/magic", "/acces"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const { cookieName } = getSessionConfig();
  const token = request.cookies.get(cookieName)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/acces?reason=missing-session", request.url));
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/acces?reason=expired", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
