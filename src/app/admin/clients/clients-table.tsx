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
import { Trash2, ShoppingBag } from "lucide-react"
import { deleteClient } from "./actions"
import Link from "next/link"

interface ClientsTableProps {
    clients: Client[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까? 관련 주문 정보도 모두 삭제될 수 있습니다.")) {
            await deleteClient(id)
        }
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
                                <TableCell>{client.manager || '-'}</TableCell>
                                <TableCell>{client.contact || '-'}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={client.address || ""}>{client.address || '-'}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <Link href={`/admin/clients/${client.id}/orders`}>
                                        <Button variant="outline" size="sm">
                                            <ShoppingBag className="mr-2 h-3 w-3" /> 주문 관리
                                        </Button>
                                    </Link>
                                    <ClientDialog client={client} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
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
