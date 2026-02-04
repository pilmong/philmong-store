'use client'

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { ArrowLeft, Edit, Save, Plus, Ticket } from "lucide-react"
import { toast } from "sonner"
import { getAdminUserDetail, updateAdminNote, grantCoupon, getAvailableCoupons } from "./actions"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [note, setNote] = useState("")
    const [coupons, setCoupons] = useState<any[]>([])
    const [selectedCouponId, setSelectedCouponId] = useState("")
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const userData = await getAdminUserDetail(id)
            setUser(userData)
            setNote(userData?.adminNote || "")

            const couponList = await getAvailableCoupons()
            setCoupons(couponList)
        } catch (error) {
            console.error(error)
            toast.error("데이터를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveNote = async () => {
        try {
            const result = await updateAdminNote(id, note)
            if (result.success) {
                toast.success("관리자 메모가 저장되었습니다.")
            } else {
                toast.error(result.message || "저장 실패")
            }
        } catch (error) {
            toast.error("저장 중 알 수 없는 오류가 발생했습니다.")
        }
    }

    const handleGrantCoupon = async () => {
        if (!selectedCouponId) return

        const result = await grantCoupon(id, selectedCouponId)
        if (result.success) {
            toast.success(result.message)
            setDialogOpen(false)
            loadData() // Refresh
        } else {
            toast.error(result.message)
        }
    }

    if (loading) return <div className="p-8 text-center">로딩 중...</div>
    if (!user) return <div className="p-8 text-center">회원 정보를 찾을 수 없습니다.</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">{user.name} 회원님 상세정보</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. 기본 정보 & 메모 */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">기본 정보</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <span className="text-muted-foreground font-medium">전화번호</span>
                                <span className="col-span-2">{user.phone}</span>

                                <span className="text-muted-foreground font-medium">가입일</span>
                                <span className="col-span-2">
                                    {format(new Date(user.createdAt), "yyyy.MM.dd", { locale: ko })}
                                </span>

                                <span className="text-muted-foreground font-medium">총 주문</span>
                                <span className="col-span-2 font-bold text-red-600">
                                    {user.orders.length}회
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center justify-between">
                                관리자 메모 📝
                                <Button size="sm" variant="ghost" onClick={handleSaveNote}>
                                    <Save className="h-4 w-4 mr-2" /> 저장
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="이 회원의 특이사항을 기록하세요. (예: 매운거 못드심, 단골 서비스 필요)"
                                className="min-h-[150px] resize-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* 쿠폰 지급 버튼 구역 */}
                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader>
                            <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                                <Ticket className="h-5 w-5" /> 쿠폰 선물하기
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                        쿠폰 지급하기
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>쿠폰 지급</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">지급할 쿠폰 선택</label>
                                            <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="쿠폰을 선택하세요" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {coupons.map(coupon => (
                                                        <SelectItem key={coupon.id} value={coupon.id}>
                                                            {coupon.name} ({coupon.discountAmount}원 할인)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleGrantCoupon} className="w-full" disabled={!selectedCouponId}>
                                            지급 완료
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. 우측 날개: 주문 이력 & 쿠폰 내역 */}
                <div className="md:col-span-2 space-y-6">
                    {/* 쿠폰 내역 (먼저 보여줌 - 현재 보유 혜택) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">보유/사용 쿠폰 ({user.coupons.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.coupons.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 text-sm">보유한 쿠폰이 없습니다.</div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {user.coupons.map((uc: any) => (
                                        <div key={uc.id} className="border rounded-md p-3 flex items-center justify-between bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${uc.isUsed ? 'bg-gray-100' : 'bg-orange-100'}`}>
                                                    <Ticket className={`h-4 w-4 ${uc.isUsed ? 'text-gray-400' : 'text-orange-600'}`} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{uc.coupon.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(uc.createdAt), "yyyy.MM.dd", { locale: ko })} 지급
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    {uc.coupon.discountAmount.toLocaleString()}원
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${uc.isUsed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700 font-bold'
                                                    }`}>
                                                    {uc.isUsed ? '사용완료' : '사용가능'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">주문 내역 ({user.orders.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.orders.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">주문 내역이 없습니다.</div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {user.orders.map((order: any) => (
                                        <div key={order.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-bold text-lg">
                                                        {format(new Date(order.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700 font-bold'
                                                        }`}>
                                                        {order.status === 'COMPLETED' ? '완료됨' : '진행중'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {order.items.map((item: any) => (
                                                        <div key={item.id}>- {item.productName} {item.quantity}개</div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">{order.totalAmount.toLocaleString()}원</div>
                                                <div className="text-sm text-gray-500">{order.deliveryType === 'DELIVERY' ? '배달' : '포장'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
