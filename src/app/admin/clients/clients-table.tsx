'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ClientDialog } from "./client-dialog"
import { Client } from "@prisma/client"
import { Trash2, ShoppingBag, Share2 } from "lucide-react"
import { deleteClient } from "./actions"
import Link from "next/link"
import { toast } from "sonner"

interface ClientsTableProps {
    clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까? 관련 주문 정보도 모두 삭제될 수 있습니다.")) {
            await deleteClient(id)
        }
    }

    const handleCopyInvite = (name: string, code: string) => {
        const url = `${window.location.origin}/b2b/login`
        const message = `[필몽] B2B 주문 시스템 안내\n\n안녕하세요, ${name} 담당자님.\n필몽 도시락/샐러드 주문 사이트 정보입니다.\n\n▶ 주문 사이트: ${url}\n▶ 로그인 코드: ${code}\n\n※ 전날 오후 3시까지 수량을 입력/수정해주세요.\n신선한 식재료를 발주/준비하기 위해 꼭 필요한 시간 입니다.\n항상 이용해주셔서 감사합니다.`

        navigator.clipboard.writeText(message).then(() => {
            toast.success(`${name} 초대 정보가 복사되었습니다. 문자나 카톡에 붙여넣어주세요!`)
        }).catch(() => {
            toast.error("복사에 실패했습니다.")
        })
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>업체명</TableHead>
                        <TableHead>코드</TableHead>
                        <TableHead>담당자</TableHead>
                        <TableHead>연락처</TableHead>
                        <TableHead>주소</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                등록된 업체가 없습니다.
                            </TableCell>
                        </TableRow>
                    ) : (
                        clients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell>{client.code || '-'}</TableCell>
                                <TableCell>{client.managerEmail || '-'}</TableCell>
                                <TableCell>{client.contact || '-'}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={client.address || ""}>{client.address || '-'}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Link href={`/admin/clients/${client.id}/orders`}>
                                        <Button variant="outline" size="sm">
                                            <ShoppingBag className="mr-2 h-3 w-3" /> 주문 관리
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50"
                                        onClick={() => handleCopyInvite(client.name, client.code || "")}
                                        title="초대 링크 복사"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <ClientDialog client={client} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(client.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
