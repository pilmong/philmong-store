'use client'

import { useEffect, useState } from "react"
import { CustomerHeader } from "../../components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { notifyPayment } from "../../orders/actions"
import { toast } from "sonner"

export default function OrderCompletePage() {
    const params = useParams()
    const orderId = params.orderId as string

    const handleNotifyPayment = async () => {
        const result = await notifyPayment(orderId)
        if (result.success) {
            toast.success("입금 알림을 보냈습니다! 사장님이 곧 확인할게요.")
        } else {
            toast.error("알림 전송 실패")
        }
    }

    // In a real app, we might fetch order details here to show confirmation.
    // For MVP, just show success message and bank info.

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <CustomerHeader />
            <div className="container mx-auto px-4 py-20 max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="h-20 w-20 text-orange-500" />
                </div>

                <h1 className="text-2xl font-bold mb-2">주문 신청이 접수되었습니다</h1>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6 text-left">
                    <p className="font-bold text-red-600 mb-1 flex items-center">
                        <span className="mr-2">⚠️</span> 필독해 주세요!
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">

                        <li className="font-bold">접수 후 2시간 내 미입금 시 주문이 자동 취소됩니다.</li>
                        <li><strong>현장 결제</strong>: 방문 시간에 오지 않으실 경우(노쇼) 주문이 취소될 수 있습니다.</li>
                    </ul>
                </div>

                <p className="text-muted-foreground mb-8 text-sm">
                    사장님이 주문을 확인하고 확정하면 알림을 드릴 예정입니다.<br />
                    (입금 확인 후 주문 확정 완료)
                </p>

                <Card className="mb-8 text-left bg-white border-orange-200 shadow-md">
                    <CardHeader className="pb-2 text-center bg-orange-50 border-b border-orange-100">
                        <CardTitle className="text-lg text-orange-800">입금 계좌 안내</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">은행명</p>
                            <p className="font-bold text-lg">카카오뱅크</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">계좌번호</p>
                            <Button variant="outline" className="mt-1 h-auto py-1 px-3 text-lg font-bold tracking-wider text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100">
                                3333-01-2345678
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 cursor-pointer">
                                (터치하여 복사 가능 - 구현 예정)
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">예금주</p>
                            <p className="font-bold">필몽 (홍길동)</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <Button onClick={handleNotifyPayment} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                        입금 완료 알림 보내기 🔔
                    </Button>
                    <Button asChild variant="outline" className="w-full h-12 text-lg">
                        <Link href="/">
                            홈으로 돌아가기
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
