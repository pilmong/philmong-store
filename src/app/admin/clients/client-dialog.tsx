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
import { Plus, Edit } from "lucide-react"

interface ClientDialogProps {
    client?: any
}

export function ClientDialog({ client }: ClientDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form States
    const [name, setName] = useState(client?.name || "")
    const [code, setCode] = useState(client?.code || "")
    const [managerEmail, setManagerEmail] = useState(client?.managerEmail || "")
    const [contact, setContact] = useState(client?.contact || "")
    const [address, setAddress] = useState(client?.address || "")
    const [note, setNote] = useState(client?.note || "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const input: ClientInput = {
            name,
            code,
            managerEmail,
            contact,
            address,
            note
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
        setManagerEmail("")
        setContact("")
        setAddress("")
        setNote("")
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
                            <Label>담당자 이메일</Label>
                            <Input value={managerEmail} onChange={e => setManagerEmail(e.target.value)} type="email" placeholder="manager@example.com" />
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
                    <div className="grid gap-2">
                        <Label>비고</Label>
                        <Input value={note} onChange={e => setNote(e.target.value)} />
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
