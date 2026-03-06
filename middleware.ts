import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "next-firebase-auth-edge";
import { authConfig } from "@/lib/firebase/config";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  
  // 1. Handle Domain Redirects
  if (host === "netcalc.curiloo.com") {
    const url = request.nextUrl.clone();
    url.host = "decidere.app";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  // 2. Handle Firebase Auth Session
  return authMiddleware(request, {
    loginPath: "/api/auth/login",
    logoutPath: "/api/auth/logout",
    apiKey: authConfig.apiKey,
    cookieName: authConfig.cookieName,
    cookieSignatureKeys: authConfig.cookieSignatureKeys,
    cookieSerializeOptions: authConfig.cookieSerializeOptions,
    serviceAccount: authConfig.serviceAccount,
  });
}

export const config = {
  // Must match all paths so the domain redirect runs everywhere, not just auth routes.
  matcher: "/:path*",
};
