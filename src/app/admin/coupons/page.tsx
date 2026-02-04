'use client'

import { useState, useEffect } from "react"
import { getCoupons, createCoupon, deleteCoupon } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2, Ticket, RefreshCw } from "lucide-react"

export default function CouponAdminPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        discountAmount: "1000",
        minOrderAmount: "10000",
        isAuto: false
    })

    const fetchCoupons = async () => {
        setLoading(true)
        const result = await getCoupons()
        if (result.success) {
            setCoupons(result.data || [])
        } else {
            toast.error(result.error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) {
            toast.error("쿠폰명을 입력해주세요.")
            return
        }
        if (!formData.isAuto && !formData.code) {
            toast.error("쿠폰 코드를 입력해주세요.")
            return
        }

        const discountAmount = parseInt(formData.discountAmount)
        const minOrderAmount = parseInt(formData.minOrderAmount)

        if (isNaN(discountAmount) || isNaN(minOrderAmount)) {
            toast.error("할인 금액과 최소 주문금액을 올바르게 입력해주세요.")
            return
        }

        const result = await createCoupon({
            name: formData.name,
            code: formData.code,
            discountAmount: discountAmount,
            minOrderAmount: minOrderAmount,
            isAuto: formData.isAuto
        })

        if (result.success) {
            toast.success("쿠폰이 생성되었습니다.")
            fetchCoupons()
            setFormData({ ...formData, name: "", code: "" }) // Reset form but keep amounts
        } else {
            toast.error(result.error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("정말 이 쿠폰을 삭제하시겠습니까?")) return
        const result = await deleteCoupon(id)
        if (result.success) {
            toast.success("쿠폰이 삭제되었습니다.")
            fetchCoupons()
        } else {
            toast.error(result.error)
        }
    }

    const generateRandomCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase()
        setFormData(prev => ({ ...prev, code: random }))
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <Ticket className="mr-2" /> 쿠폰 관리
            </h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">새 쿠폰 등록</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label>쿠폰명</Label>
                                <Input
                                    placeholder="예: 오픈 이벤트 할인"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isAuto"
                                    checked={formData.isAuto}
                                    onChange={e => setFormData({ ...formData, isAuto: e.target.checked, code: e.target.checked ? "AUTO-" + Math.random().toString(36).substring(2, 6).toUpperCase() : "" })}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="isAuto" className="font-bold text-blue-600">
                                    [조건부 자동 할인] 설정
                                </Label>
                            </div>

                            {!formData.isAuto && (
                                <div>
                                    <Label>쿠폰 코드 (영어/숫자)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="예: SUMMER2024"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="uppercase font-mono"
                                        />
                                        <Button type="button" variant="outline" size="icon" onClick={generateRandomCode} title="랜덤 코드 생성">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {formData.isAuto && (
                                <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                                    * 주문 금액이 조건을 만족하면 자동으로 이 쿠폰이 적용됩니다.<br />
                                    * 코드는 시스템에서 자동으로 관리됩니다.
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>할인 금액</Label>
                                    <Input
                                        type="number"
                                        value={formData.discountAmount}
                                        onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>최소 주문금액</Label>
                                    <Input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> 쿠폰 생성
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">발급된 쿠폰 목록</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-10">로딩 중...</div>
                        ) : coupons.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">등록된 쿠폰이 없습니다.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>쿠폰명</TableHead>
                                        <TableHead>코드</TableHead>
                                        <TableHead>혜택</TableHead>
                                        <TableHead>사용 횟수</TableHead>
                                        <TableHead className="text-right">관리</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map(coupon => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-medium">{coupon.name}</TableCell>
                                            <TableCell>
                                                {coupon.isAuto ? (
                                                    <Badge className="bg-blue-600 hover:bg-blue-700">자동적용</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="font-mono bg-slate-50">
                                                        {coupon.code}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-blue-600">
                                                    -{coupon.discountAmount.toLocaleString()}원
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {coupon.minOrderAmount.toLocaleString()}원 이상
                                                </div>
                                            </TableCell>
                                            <TableCell>{coupon._count?.usedOrders || 0}회</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(coupon.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
