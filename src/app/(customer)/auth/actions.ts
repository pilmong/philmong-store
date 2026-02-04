'use server'

import { prisma } from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import { setSession, clearSession } from "@/lib/auth"
import { redirect } from "next/navigation"

// 1. 휴대폰 인증번호 발송 (가상 시뮬레이션)
export async function sendVerificationCode(phone: string) {
    // 실제 SMS 발송 로직은 여기에 들어갑니다 (Example: CoolSMS, Aligo)
    // 지금은 개발용으로 무조건 '1234'를 리턴합니다.
    console.log(`[Simulation] SMS sent to ${phone}: 1234`)

    // 이미 가입된 번호인지 확인
    const existingUser = await prisma.user.findUnique({
        where: { phone }
    })

    return {
        success: true,
        code: "1234", // 실제로는 DB/Redis에 저장하고 비교해야 함
        isRegistered: !!existingUser, // 이미 가입된 회원인지 여부
        message: "인증번호가 발송되었습니다. (테스트용: 1234)"
    }
}

// 2. 회원가입
export async function registerUser(data: { name: string, phone: string, password: string }) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { phone: data.phone }
        })

        if (existingUser) {
            return { success: false, message: "이미 가입된 휴대폰 번호입니다." }
        }

        const hashedPassword = await hash(data.password, 10)

        const user = await prisma.user.create({
            data: {
                name: data.name,
                phone: data.phone,
                password: hashedPassword
            }
        })

        // 가입 완료 후 자동 로그인 처리
        await setSession(user)

        return { success: true, message: "회원가입이 완료되었습니다." }
    } catch (error) {
        console.error("Register Error:", error)
        return { success: false, message: "회원가입 중 오류가 발생했습니다." }
    }
}

// 3. 로그인
export async function loginUser(phone: string, password: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { phone }
        })

        if (!user) {
            return { success: false, message: "가입되지 않은 번호입니다." }
        }

        const isValid = await compare(password, user.password)

        if (!isValid) {
            return { success: false, message: "비밀번호가 일치하지 않습니다." }
        }

        await setSession(user)
        return { success: true, message: "로그인 성공" }
    } catch (error) {
        console.error("Login Error:", error)
        return { success: false, message: "로그인 중 오류가 발생했습니다." }
    }
}

// 4. 로그아웃
export async function logoutUser() {
    await clearSession()
    redirect("/")
}

// 5. 세션 정보 가져오기 (Client Component용)
export async function getUserSession() {
    const { getSession } = await import("@/lib/auth")
    const session = await getSession()
    return session
}
