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
import { Badge } from "@/components/ui/badge"
import { DeliveryZoneDialog } from "./delivery-zone-dialog"
import { DeliveryZone } from "@prisma/client"
import { Trash2 } from "lucide-react"
import { deleteDeliveryZone } from "./actions"

interface DeliveryZoneListProps {
    zones: DeliveryZone[]
}

export function DeliveryZoneList({ zones }: DeliveryZoneListProps) {
    const handleDelete = async (id: string) => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await deleteDeliveryZone(id)
        }
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>상태</TableHead>
                        <TableHead>구역명</TableHead>
                        <TableHead>배달 지역</TableHead>
                        <TableHead>배달비</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {zones.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                등록된 배달 구역이 없습니다.
                            </TableCell>
                        </TableRow>
                    ) : (
                        zones.map((zone) => (
                            <TableRow key={zone.id}>
                                <TableCell>
                                    <Badge variant={zone.isActive ? "default" : "outline"}>
                                        {zone.isActive ? "사용 중" : "중지됨"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{zone.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {zone.areas.map((area, idx) => (
                                            <Badge key={idx} variant="secondary" className="px-1 py-0 text-[10px]">
                                                {area}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>{zone.price.toLocaleString()}원</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <DeliveryZoneDialog zone={zone} />
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)}>
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
