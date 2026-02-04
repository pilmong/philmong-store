'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { loginB2BClient } from "../actions"
import { Store, ArrowRight, Loader2 } from "lucide-react"

export default function B2BLoginPage() {
    const router = useRouter()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code) return

        setLoading(true)
        try {
            const result = await loginB2BClient(code)

            if (result.success) {
                toast.success("로그인되었습니다.")
                router.push("/b2b/dashboard")
            } else {
                toast.error(result.message || "로그인 실패")
            }
        } catch (error) {
            console.error(error)
            toast.error("오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 space-y-8">
                <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">B2B 기업 파트너</h1>
                    <p className="text-slate-500">
                        발급받으신 기업 코드로 접속해주세요.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label>기업 접속 코드</Label>
                        <Input
                            placeholder="CODE 입력"
                            className="text-center text-lg uppercase font-mono tracking-widest h-12"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        접속하기
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </form>

                <div className="text-center text-xs text-slate-400">
                    문의: 010-1234-5678 (필몽 고객센터)
                </div>
            </div>
        </div>
    )
}
