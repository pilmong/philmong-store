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
import { upsertDeliveryZone, type DeliveryZoneInput } from "./actions"
import { DeliveryZone } from "@prisma/client"
import { Plus, Edit } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface DeliveryZoneDialogProps {
    zone?: DeliveryZone
}

export function DeliveryZoneDialog({ zone }: DeliveryZoneDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form States
    const [name, setName] = useState(zone?.name || "")
    const [price, setPrice] = useState(zone?.price || 3000)
    const [areasInput, setAreasInput] = useState(zone?.areas.join(", ") || "")
    const [isActive, setIsActive] = useState(zone?.isActive ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Parse areas from comma separated string
        const areas = areasInput.split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)

        const input: DeliveryZoneInput = {
            name,
            price,
            areas,
            isActive
        }

        const res = await upsertDeliveryZone(zone?.id || null, input)

        setLoading(false)
        if (res.success) {
            setOpen(false)
            if (!zone) resetForm()
        } else {
            alert(res.error)
        }
    }

    const resetForm = () => {
        setName("")
        setPrice(3000)
        setAreasInput("")
        setIsActive(true)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {zone ? (
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                ) : (
                    <Button><Plus className="mr-2 h-4 w-4" /> 배달 구역 추가</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{zone ? "구역 수정" : "새 배달 구역 등록"}</DialogTitle>
                    <DialogDescription>
                        배달비가 동일한 지역들을 묶어서 등록하세요.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={(checked) => setIsActive(checked as boolean)}
                        />
                        <Label htmlFor="isActive">사용 중</Label>
                    </div>

                    <div className="grid gap-2">
                        <Label>구역명</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="예: A구역 (가까운 곳)" required />
                    </div>

                    <div className="grid gap-2">
                        <Label>배달 지역 (매칭 키워드)</Label>
                        <p className="text-[0.8rem] text-muted-foreground my-1">
                            법정동/행정동(예: 남외동) 또는 도로명(예: 번영로)을 콤마(,)로 구분해 입력하세요.
                        </p>
                        <Input
                            value={areasInput}
                            onChange={e => setAreasInput(e.target.value)}
                            placeholder="예: 남외동, 병영1동, 번영로, 종가로"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                            {areasInput.split(',').map(s => s.trim()).filter(s => s).map((area, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>배달 가격 (원)</Label>
                        <Input
                            type="text"
                            value={price.toString()}
                            onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '')
                                setPrice(val === '' ? 0 : Number(val))
                            }}
                            placeholder="0"
                        />
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
