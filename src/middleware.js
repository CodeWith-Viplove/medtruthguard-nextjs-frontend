import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/home")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = pathname.startsWith("/home/doctor")
        ? "/login/doctor"
        : "/login/citizen";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/home/doctor") && token.role !== "doctor") {
      return NextResponse.redirect(new URL("/login/doctor", request.url));
    }

    if (pathname.startsWith("/home/citizen") && token.role !== "citizen") {
      return NextResponse.redirect(new URL("/login/citizen", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*"],
};
