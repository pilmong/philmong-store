'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { loginUser } from "../actions"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || !password) {
            toast.error("전화번호와 비밀번호를 입력해주세요.")
            return
        }

        setLoading(true)
        try {
            const result = await loginUser(phone, password)
            if (result.success) {
                toast.success("로그인되었습니다.")
                router.push("/")
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("로그인 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    필몽 로그인
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    아직 회원이 아니신가요?{' '}
                    <Link href="/auth/register" className="font-semibold text-primary hover:text-primary/80">
                        3초만에 가입하기
                    </Link>
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <Label htmlFor="phone">휴대폰 번호</Label>
                        <div className="mt-2">
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                placeholder="010-0000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">비밀번호</Label>
                        </div>
                        <div className="mt-2">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="숫자 4자리"
                                maxLength={4}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            로그인
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center text-sm">
                    <Link href="/" className="text-gray-500 underline">
                        비회원으로 둘러보기
                    </Link>
                </div>
            </div>
        </div>
    )
}
