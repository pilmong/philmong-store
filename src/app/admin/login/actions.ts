'use server'

import { setSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function login(prevState: any, formData: FormData) {
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string

    // TODO: Use real DB verification with hashed passwords
    // For now, allow a hardcoded admin credential for initial setup
    const ADMIN_PHONE = "01012345678"
    const ADMIN_PASS = "admin1234"

    if (phone === ADMIN_PHONE && password === ADMIN_PASS) {
        await setSession({
            id: "admin-master",
            name: "관리자",
            phone: ADMIN_PHONE,
            role: "ADMIN" // Future proofing
        })
        redirect("/admin")
    }

    // Optional: Check against DB
    const user = await prisma.user.findUnique({
        where: { phone }
    })

    // Simple plain text check for demo/dev (User table needs encryption logic in real app)
    if (user && user.password === password) {
        await setSession({
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: "USER" // Default
        })
        redirect("/admin")
    }

    return { error: "전화번호 또는 비밀번호가 일치하지 않습니다." }
}
