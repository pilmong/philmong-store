import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const SECRET_KEY = process.env.JWT_SECRET || "philmong-master-secret-key-2024"
const key = new TextEncoder().encode(SECRET_KEY)

export async function signSession(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d") // 30일 로그인 유지
        .sign(key)
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        })
        return payload
    } catch (error) {
        return null
    }
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value
    if (!session) return null
    return await verifySession(session)
}

export async function setSession(user: any) {
    // 필요한 최소 정보만 저장
    const sessionUser = {
        id: user.id,
        name: user.name,
        phone: user.phone,
    }

    const token = await signSession(sessionUser)
    const cookieStore = await cookies()

    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
    })
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    // Refresh the session so it doesn't expire
    const parsed = await verifySession(session);
    if (!parsed) return;

    // 30일 연장
    parsed.exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);

    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await signSession(parsed),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
    });
    return res;
}
