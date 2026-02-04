'use client'

import { CustomerHeader } from "../components/header"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrder, validateCoupon, getAvailableCoupons } from "../orders/actions"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

import { getUserSession } from "../auth/actions"

// ... imports

export default function CheckoutPage() {
    const router = useRouter()
    const { items, totalPrice, clearCart } = useCartStore()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null) // User Session

    // Form States
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")

    // Delivery States
    const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY")
    const [address, setAddress] = useState("")
    const [detailAddress, setDetailAddress] = useState("")
    const [deliveryFee, setDeliveryFee] = useState(0)
    const [requestNote, setRequestNote] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("TRANSFER")

    // Coupon States
    const [couponCode, setCouponCode] = useState("")
    const [appliedCoupon, setAppliedCoupon] = useState<{ id: string, name: string, discountAmount: number } | null>(null)
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([])
    const [showManualInput, setShowManualInput] = useState(false)

    // Derived State
    const finalAmount = Math.max(0, totalPrice() + (deliveryType === "DELIVERY" ? deliveryFee : 0) - (appliedCoupon?.discountAmount || 0))

    useEffect(() => {
        // Fetch available coupons
        if (totalPrice() > 0) {
            getAvailableCoupons(totalPrice()).then(res => {
                if (res.success && res.coupons) {
                    setAvailableCoupons(res.coupons)
                }
            })
        }
    }, [totalPrice])

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        const result = await validateCoupon(couponCode, totalPrice())
        if (result.success && result.coupon) {
            setAppliedCoupon(result.coupon)
            toast.success("쿠폰이 적용되었습니다.")
            setCouponCode("")
            setShowManualInput(false)
        } else {
            toast.error(result.error || "쿠폰 적용 실패")
        }
    }

    useEffect(() => {
        setMounted(true)

        // Load Query Params
        const params = new URLSearchParams(window.location.search)
        // ... (existing params logic) ...
        const typeParam = params.get("type") as "DELIVERY" | "PICKUP" | null
        if (typeParam) setDeliveryType(typeParam)
        if (params.get("address")) setAddress(params.get("address") || "")
        if (params.get("detailAddress")) setDetailAddress(params.get("detailAddress") || "")
        if (params.get("fee")) setDeliveryFee(parseInt(params.get("fee") || "0"))
        if (params.get("note")) setRequestNote(params.get("note") || "")

        // Load User Session
        getUserSession().then((userData: any) => {
            if (userData) {
                setUser(userData)
                setName(userData.name)
                setPhone(userData.phone)
                // Password is not needed for logged in users
            }
        })
    }, [])

    // ...

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: Password is required only for guests
        if (!name || !phone) {
            toast.error("주문자 정보를 입력해주세요.")
            return
        }
        if (!user && !password) {
            toast.error("비회원 주문 조회용 비밀번호를 입력해주세요.")
            return
        }

        setLoading(true)
        try {
            const orderData = {
                userId: user?.id,
                items: items.map(i => ({
                    productId: i.product.id,
                    quantity: i.quantity,
                    price: i.product.basePrice
                })),
                customer: { name, phone, password },
                delivery: {
                    address: deliveryType === "DELIVERY" ? address : "",
                    detailAddress: deliveryType === "DELIVERY" ? detailAddress : "",
                    fee: deliveryFee
                },
                payment: paymentMethod,
                note: requestNote,
                couponId: appliedCoupon?.id,
                discountAmount: appliedCoupon?.discountAmount
            }

            const result = await createOrder(orderData)

            if (result.success) {
                clearCart() // Clear cart
                router.push(`/order-complete/${result.orderId}`)
            } else {
                toast.error(result.message || "주문 실패")
            }
        } catch (error) {
            console.error(error)
            toast.error("오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <CustomerHeader />
            <div className="container mx-auto px-4 py-8 max-w-lg">
                <h1 className="text-2xl font-bold mb-6">주문서 작성</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                        <h3 className="font-bold flex items-center justify-between">
                            주문자 정보
                            {user && <Badge variant="secondary" className="ml-2">회원 {user.name}님</Badge>}
                        </h3>
                        <div className="space-y-2">
                            <Label>이름</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" readOnly={!!user} className={user ? "bg-gray-100" : ""} />
                        </div>
                        <div className="space-y-2">
                            <Label>연락처</Label>
                            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" type="tel" readOnly={!!user} className={user ? "bg-gray-100" : ""} />
                        </div>

                        {
                            !user && (
                                <div className="space-y-2">
                                    <Label>주문 비밀번호</Label>
                                    <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="숫자 4자리 (주문 조회용)" type="password" maxLength={4} />
                                </div>
                            )
                        }
                    </div >

                    {/* Address Info */}
                    < div className="bg-white p-6 rounded-lg shadow-sm border space-y-4" >
                        <h3 className="font-bold">{deliveryType === "DELIVERY" ? "배송지 정보" : "수령 방법"}</h3>
                        <div className="text-sm bg-slate-50 p-3 rounded border">
                            {deliveryType === "DELIVERY" ? (
                                <>
                                    <p className="font-bold">{address}</p>
                                    <p>{detailAddress}</p>
                                    <p className="text-blue-600 mt-1">배달비: {deliveryFee.toLocaleString()}원</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-lg text-primary mb-1">매장 방문 포장 (픽업)</p>
                                    <p className="text-muted-foreground">울산광역시 중구 종가로 123 (필몽)</p>
                                </>
                            )}
                        </div>
                    </div >


                    {/* Request Note (Read Only or Editable) */}
                    < div className="bg-white p-6 rounded-lg shadow-sm border space-y-4" >
                        <h3 className="font-bold">요청사항</h3>
                        <Input
                            value={requestNote}
                            onChange={(e) => setRequestNote(e.target.value)}
                            placeholder="요청사항을 입력해주세요."
                        />
                    </div >


                    {/* Coupon Section */}
                    < div className="bg-white p-6 rounded-lg shadow-sm border space-y-4" >
                        <h3 className="font-bold flex items-center gap-2">
                            할인 쿠폰
                        </h3>

                        {/* Available Coupons List */}
                        {
                            availableCoupons.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    <Label className="text-sm text-muted-foreground">사용 가능한 할인 혜택</Label>
                                    <RadioGroup
                                        value={appliedCoupon?.id || ""}
                                        onValueChange={(val) => {
                                            const selected = availableCoupons.find(c => c.id === val)
                                            if (selected) {
                                                setAppliedCoupon(selected)
                                                setCouponCode("") // Clear manual code if auto selected
                                            }
                                        }}
                                    >
                                        {availableCoupons.map(coupon => (
                                            <div key={coupon.id} className={`flex items-center justify-between p-3 rounded border ${appliedCoupon?.id === coupon.id ? 'border-primary bg-blue-50' : 'border-gray-200 hover:bg-slate-50'}`}>
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <RadioGroupItem value={coupon.id} id={coupon.id} />
                                                    <Label
                                                        htmlFor={coupon.id}
                                                        className="grid gap-1.5 leading-none w-full cursor-pointer py-2"
                                                    >
                                                        <span className="text-sm font-medium leading-none">
                                                            {coupon.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {coupon.minOrderAmount.toLocaleString()}원 이상 구매 시
                                                        </span>
                                                    </Label>
                                                </div>
                                                <div className="font-bold text-blue-600">
                                                    -{coupon.discountAmount.toLocaleString()}원
                                                </div>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )
                        }

                        {/* Manual Code Input */}
                        <div className="pt-2 border-t">
                            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setShowManualInput(!showManualInput)}>
                                <span className="text-sm font-medium">쿠폰 코드 직접 입력</span>
                                <span className="text-xs text-muted-foreground">{showManualInput ? "접기" : "펼치기"}</span>
                            </div>

                            {(showManualInput || availableCoupons.length === 0) && (
                                <div className="flex gap-2">
                                    <Input
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="쿠폰 코드 입력"
                                        className="uppercase font-mono"
                                        disabled={!!appliedCoupon && !couponCode} // Disabled only if applied via list (id match) but simplistic check
                                    />
                                    <Button type="button" variant="secondary" onClick={handleApplyCoupon} disabled={!couponCode}>
                                        확인
                                    </Button>
                                </div>
                            )}
                        </div>

                        {
                            appliedCoupon && (
                                <div className="text-sm text-green-600 bg-green-50 p-3 rounded flex justify-between items-center mt-2">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-black">{appliedCoupon.name}</span>
                                        <span>할인이 적용되었습니다.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg">- {appliedCoupon.discountAmount.toLocaleString()}원</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                                            onClick={(e) => {
                                                e.stopPropagation() // Prevent bubbling just in case
                                                console.log("Canceling coupon...")
                                                setAppliedCoupon(null)
                                                setCouponCode("")
                                                toast.info("쿠폰 적용을 취소했습니다.")
                                            }}
                                        >
                                            <Trash2 className="w-3.4 h-3.5 mr-1" />
                                            취소
                                        </Button>
                                    </div>
                                </div>
                            )
                        }
                    </div >

                    {/* Payment Method */}
                    < div className="bg-white p-6 rounded-lg shadow-sm border space-y-4" >
                        <h3 className="font-bold">결제 수단</h3>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="TRANSFER" id="TRANSFER" />
                                <Label htmlFor="TRANSFER">무통장 입금</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ONSITE" id="ONSITE" />
                                <Label htmlFor="ONSITE">현장 결제 (픽업)</Label>
                            </div>
                        </RadioGroup>
                    </div >

                    {/* Summary */}
                    < div className="space-y-2 pt-4 border-t" >
                        <div className="flex justify-between text-muted-foreground">
                            <span>주문 금액</span>
                            <span>{totalPrice().toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>배달비</span>
                            <span>{deliveryFee.toLocaleString()}원</span>
                        </div>
                        {
                            appliedCoupon && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>할인</span>
                                    <span>- {appliedCoupon.discountAmount.toLocaleString()}원</span>
                                </div>
                            )
                        }
                        <div className="flex justify-between text-xl font-bold pt-2">
                            <span>총 결제 금액</span>
                            <span>{finalAmount.toLocaleString()}원</span>
                        </div>
                    </div >

                    {/* Submit */}
                    < Button className="w-full h-12 text-lg" type="submit" disabled={loading} >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        }
                        {finalAmount.toLocaleString()}원 결제하기
                    </Button >
                </form >
            </div >
        </div >

    )
}
