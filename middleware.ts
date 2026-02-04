import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    // 1. Update session if it exists (extend expiry)
    // This connects to lib/auth.ts to verify/refresh JWT
    await updateSession(request);

    // 2. Define protected routes
    const path = request.nextUrl.pathname;
    const isProtected = path.startsWith("/admin");
    const isLoginPage = path === "/admin/login";

    // 3. Check for session
    const session = request.cookies.get("session")?.value;

    // 4. Redirect logic
    if (isProtected && !isLoginPage) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
    }

    if (isLoginPage && session) {
        return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
    ],
};
