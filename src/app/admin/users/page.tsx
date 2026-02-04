'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search, User as UserIcon, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getAdminUsers } from "./actions"

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const result = await getAdminUsers(search)
            setUsers(result)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">회원 관리</h1>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="이름 또는 전화번호 검색"
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                        />
                    </div>
                    <Button onClick={loadUsers}>검색</Button>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>이름</TableHead>
                            <TableHead>전화번호</TableHead>
                            <TableHead>가입일</TableHead>
                            <TableHead>주문 횟수</TableHead>
                            <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">
                                    로딩 중...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                        {user.name}
                                    </TableCell>
                                    <TableCell>{user.phone}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm", { locale: ko })}
                                    </TableCell>
                                    <TableCell>
                                        {user._count.orders}회
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={`/admin/users/${user.id}`}>
                                                상세보기
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
