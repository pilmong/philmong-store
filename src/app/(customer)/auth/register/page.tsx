'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { sendVerificationCode, registerUser } from "../actions"
import { Loader2, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = useState<"VERIFY" | "INFO">("VERIFY")
    const [loading, setLoading] = useState(false)

    // Verify State
    const [phone, setPhone] = useState("")
    const [code, setCode] = useState("")
    const [sentCode, setSentCode] = useState("") // In real app, verify on server
    const [isVerified, setIsVerified] = useState(false)

    // Info State
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")

    const handleSendCode = async () => {
        if (!phone || phone.length < 10) {
            toast.error("올바른 휴대폰 번호를 입력해주세요.")
            return
        }

        setLoading(true)
        try {
            const result = await sendVerificationCode(phone)
            if (result.success) {
                if (result.isRegistered) {
                    toast.error("이미 가입된 번호입니다. 로그인해주세요.")
                    setTimeout(() => router.push("/auth/login"), 1500)
                } else {
                    toast.success(result.message) // 1234
                    setSentCode(result.code || "")
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("인증번호 발송 실패")
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = () => {
        if (code === sentCode && sentCode !== "") {
            setIsVerified(true)
            toast.success("인증되었습니다!")
            setTimeout(() => setStep("INFO"), 500)
        } else {
            toast.error("인증번호가 일치하지 않습니다. (테스트: 1234)")
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== passwordConfirm) {
            toast.error("비밀번호가 일치하지 않습니다.")
            return
        }
        if (password.length < 4) {
            toast.error("비밀번호는 4자리 이상이어야 합니다.")
            return
        }

        setLoading(true)
        try {
            const result = await registerUser({ name, phone, password })
            if (result.success) {
                toast.success("환영합니다! 가입이 완료되었습니다.")
                router.push("/")
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("가입 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                    간편 회원가입
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                {step === "VERIFY" ? (
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="phone">휴대폰 번호</Label>
                            <div className="flex gap-2 mt-2">
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="010-0000-0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={loading || isVerified}
                                />
                                <Button type="button" onClick={handleSendCode} disabled={loading || isVerified || !phone}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증번호"}
                                </Button>
                            </div>
                        </div>

                        {sentCode && !isVerified && (
                            <div>
                                <Label htmlFor="code">인증번호</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        id="code"
                                        placeholder="1234"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <Button type="button" onClick={handleVerify} variant="secondary">
                                        확인
                                    </Button>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">* 테스트용 코드: 1234를 입력하세요.</p>
                            </div>
                        )}

                        <div className="text-center text-sm pt-4">
                            이미 계정이 있으신가요?{' '}
                            <Link href="/auth/login" className="font-semibold text-primary">
                                로그인하기
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div className="bg-green-50 p-3 rounded text-green-700 text-sm flex items-center mb-4">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {phone} 인증 완료
                        </div>

                        <div>
                            <Label htmlFor="name">이름 (또는 닉네임)</Label>
                            <div className="mt-2">
                                <Input
                                    id="name"
                                    required
                                    placeholder="홍길동"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">비밀번호 설정</Label>
                            <div className="mt-2">
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="숫자 4자리"
                                    maxLength={4}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                            <div className="mt-2">
                                <Input
                                    id="passwordConfirm"
                                    type="password"
                                    required
                                    placeholder="한 번 더 입력"
                                    maxLength={4}
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            가입 완료
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}
