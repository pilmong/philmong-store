'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { upsertClient, type ClientInput } from "./actions"
import { Plus, Edit, CreditCard, Clock, Calendar } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { B2BPaymentMethod, B2BPaymentTiming, Client } from "@prisma/client"

interface ClientDialogProps {
    client?: Client // If provided, edit mode
}

export function ClientDialog({ client }: ClientDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form States
    const [name, setName] = useState(client?.name || "")
    const [code, setCode] = useState(client?.code || "")
    const [manager, setManager] = useState(client?.manager || "")
    const [contact, setContact] = useState(client?.contact || "")
    const [address, setAddress] = useState(client?.address || "")
    const [paymentMethod, setPaymentMethod] = useState<B2BPaymentMethod>(client?.paymentMethod || "CARD")
    const [paymentTiming, setPaymentTiming] = useState<B2BPaymentTiming>(client?.paymentTiming || "IMMEDIATE")
    const [paymentDay, setPaymentDay] = useState<string>((client as any)?.paymentDay?.toString() || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const input: ClientInput = {
            name,
            code,
            manager,
            contact,
            address,
            paymentMethod,
            paymentTiming,
            paymentDay: (paymentDay && paymentDay !== "none") ? parseInt(paymentDay) : null
        }
        const res = await upsertClient(client?.id || null, input)

        setLoading(false)
        if (res.success) {
            setOpen(false)
            if (!client) resetForm()
        } else {
            alert(res.error)
        }
    }

    const resetForm = () => {
        setName("")
        setCode("")
        setManager("")
        setContact("")
        setAddress("")
        setPaymentDay("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {client ? (
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                ) : (
                    <Button><Plus className="mr-2 h-4 w-4" /> 업체 등록</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{client ? "업체 정보 수정" : "새 업체 등록"}</DialogTitle>
                    <DialogDescription>
                        B2B 고객사 정보를 입력하세요.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label>업체명 (필수)</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="(주)필몽전자" />
                    </div>
                    <div className="grid gap-2">
                        <Label>업체 코드 (로그인용)</Label>
                        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="PM_ELEC" />
                        <p className="text-xs text-muted-foreground">담당자 로그인 시 사용됩니다.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>담당자명</Label>
                            <Input value={manager} onChange={e => setManager(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>연락처</Label>
                            <Input value={contact} onChange={e => setContact(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>배달 주소</Label>
                        <Input value={address} onChange={e => setAddress(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> 결제 수단</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="수단 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CARD">카드 결제</SelectItem>
                                    <SelectItem value="CASH">현금/이체</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> 결제 시점</Label>
                            <Select value={paymentTiming} onValueChange={(v: any) => setPaymentTiming(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="시점 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IMMEDIATE">즉시 결제</SelectItem>
                                    <SelectItem value="DEFERRED">후불 (지정일)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> 정기 결제일 (매달 고정)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">
                                    {paymentDay && paymentDay !== "none" && paymentDay !== "" ? (
                                        paymentDay === "99" ? "매달 말일" : `매달 ${paymentDay}일`
                                    ) : (
                                        <span className="text-muted-foreground">결제 일자 선택 (선택 안함)</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3" align="start">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <Button
                                                key={day}
                                                variant={paymentDay === day.toString() ? "default" : "ghost"}
                                                size="sm"
                                                className="h-9 w-9 p-0 font-normal"
                                                onClick={() => setPaymentDay(day.toString())}
                                            >
                                                {day}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 border-t pt-2">
                                        <Button
                                            variant={paymentDay === "99" ? "default" : "outline"}
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setPaymentDay("99")}
                                        >
                                            매달 말일
                                        </Button>
                                        <Button
                                            variant={paymentDay === "none" || paymentDay === "" ? "default" : "outline"}
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setPaymentDay("none")}
                                        >
                                            선택 안함
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <p className="text-[11px] text-muted-foreground">후불 정산 고객의 경우, 지정된 날짜에 알림이 생성됩니다.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>취소</Button>
                        <Button type="submit" disabled={loading}>저장</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
