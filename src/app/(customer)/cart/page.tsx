'use client'

import { CustomerHeader } from "../components/header"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus, Trash2, Search } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Script from "next/script"
import { calculateDeliveryFee } from "../actions"
import { toast } from "sonner"

declare global {
    interface Window {
        daum: any;
    }
}

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [address, setAddress] = useState("")
    const [detailAddress, setDetailAddress] = useState("")
    const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY")
    const [deliveryFee, setDeliveryFee] = useState(0)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isCalculating, setIsCalculating] = useState(false)
    const [deliveryMessage, setDeliveryMessage] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSearchAddress = () => {
        if (!window.daum || !window.daum.Postcode) {
            alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.")
            return
        }

        new window.daum.Postcode({
            oncomplete: async function (data: any) {
                // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.
                const fullAddress = data.roadAddress || data.jibunAddress
                setAddress(fullAddress)

                const extraAddr = data.bname || data.jibunAddress || ""

                // 배달비 계산
                setIsCalculating(true)
                try {
                    const result = await calculateDeliveryFee(fullAddress, extraAddr)

                    if (result.success) {
                        setDeliveryFee(result.fee)
                        setDeliveryMessage(`배달비 ${result.fee.toLocaleString()}원 (${result.zoneName})`)
                        toast.success("배달비가 적용되었습니다.")
                    } else {
                        setDeliveryFee(0)
                        setDeliveryMessage(result.message || "배달 불가 지역입니다.")
                        toast.error(result.message || "배달 불가 지역입니다.")
                    }
                } catch (e) {
                    console.error(e)
                    toast.error("배달비 계산 중 오류가 발생했습니다.")
                } finally {
                    setIsCalculating(false)
                }
            }
        }).open()
    }

    if (!mounted) return null

    const finalPrice = totalPrice() + deliveryFee

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
            <CustomerHeader />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-2xl font-bold mb-6">장바구니</h1>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <p className="text-muted-foreground mb-4">장바구니가 비어있습니다.</p>
                        <Link href="/">
                            <Button>메뉴 보러 가기</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border divide-y">
                            {items.map((item) => (
                                <div key={item.product.id} className="p-4 flex gap-4">
                                    <div className="h-20 w-20 bg-slate-100 rounded-md flex-shrink-0 flex items-center justify-center bg-gray-100 text-xs text-slate-400">
                                        No Image
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold">{item.product.name}</h3>
                                        <p className="text-sm text-muted-foreground">{item.product.basePrice.toLocaleString()}원</p>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="font-bold">{(item.product.basePrice * item.quantity).toLocaleString()}원</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.product.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                            <h3 className="font-bold text-lg">배달 / 포장 선택</h3>

                            <div className="flex p-1 bg-slate-100 rounded-lg mb-4">
                                <button
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${deliveryType === "DELIVERY" ? "bg-white shadow text-primary" : "text-slate-500"}`}
                                    onClick={() => setDeliveryType("DELIVERY")}
                                >
                                    배달 받기
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${deliveryType === "PICKUP" ? "bg-white shadow text-primary" : "text-slate-500"}`}
                                    onClick={() => {
                                        setDeliveryType("PICKUP")
                                        setDeliveryFee(0)
                                        setDeliveryMessage("")
                                    }}
                                >
                                    포장 하기 (픽업)
                                </button>
                            </div>

                            {deliveryType === "DELIVERY" ? (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            placeholder="주소를 검색해주세요"
                                            value={address}
                                            onClick={handleSearchAddress}
                                            className="cursor-pointer bg-slate-50"
                                        />
                                        <Button onClick={handleSearchAddress} variant="outline">
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {address && (
                                        <Input
                                            placeholder="상세 주소를 입력해주세요 (예: 101동 101호)"
                                            value={detailAddress}
                                            onChange={(e) => setDetailAddress(e.target.value)}
                                            className="mt-2"
                                        />
                                    )}
                                    {deliveryMessage && (
                                        <p className={`text-sm mt-2 ${deliveryFee > 0 ? "text-blue-600" : "text-red-500"}`}>
                                            {deliveryMessage}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-4 bg-slate-50 rounded border border-dashed">
                                    <p className="font-bold text-primary">매장 방문 포장</p>
                                    <p className="text-sm text-slate-500 mt-1">울산광역시 중구 종가로 123 (필몽)</p>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                            <h3 className="font-bold text-lg">결제 정보</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">총 수량</span>
                                    <span>{totalItems()}개</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">상품 금액</span>
                                    <span>{totalPrice().toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-blue-600 font-medium">
                                    <span>배달비</span>
                                    <span>+{deliveryFee.toLocaleString()}원</span>
                                </div>
                            </div>
                            <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                                <span>총 결제금액</span>
                                <span className="text-orange-600">{finalPrice.toLocaleString()}원</span>
                            </div>

                            <Button
                                className="w-full text-lg h-12 mt-4"
                                disabled={deliveryType === "DELIVERY" && (!address || deliveryFee === 0)}
                                onClick={() => {
                                    const params = new URLSearchParams()
                                    params.set("type", deliveryType)

                                    if (deliveryType === "DELIVERY") {
                                        params.set("address", address)
                                        params.set("detailAddress", detailAddress)
                                        params.set("fee", deliveryFee.toString())
                                    } else {
                                        params.set("fee", "0")
                                    }
                                    // Make sure to use encoded params
                                    window.location.href = `/checkout?${params.toString()}`
                                }}
                            >
                                주문서 작성하기
                            </Button>
                        </div>
                    </div>
                )
                }

            </div>
        </div>
    )
}
