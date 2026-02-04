'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CustomerHeader } from "../components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { lookupOrder } from "../orders/actions"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"

export default function OrderLookupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        phone: "",
        password: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.phone || !formData.password) {
            toast.error("전화번호와 비밀번호를 모두 입력해주세요.")
            return
        }

        setLoading(true)
        const result = await lookupOrder(formData.phone, formData.password)

        if (result.success && result.orderId) {
            toast.success("주문 내역을 찾았습니다!")
            router.push(`/my-order/${result.orderId}`)
        } else {
            toast.error(result.error || "일치하는 주문이 없습니다.")
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <CustomerHeader />
            <div className="container mx-auto px-4 py-20 max-w-md">
                <Card className="bg-white border-none shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Search className="w-8 h-8 text-orange-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">주문 조회</CardTitle>
                        <CardDescription>
                            주문 시 입력한 전화번호와 비밀번호를 입력해주세요.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">휴대폰 번호</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="01012345678"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    className="text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">비밀번호 (4자리)</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    placeholder="****"
                                    value={formData.password}
                                    onChange={handleChange}
                                    type="password"
                                    maxLength={4}
                                    className="text-lg"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg mt-4 bg-orange-600 hover:bg-orange-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        조회 중...
                                    </>
                                ) : "내 주문 찾기"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
