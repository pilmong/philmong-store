'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductType, ProductCategory, WorkDivision, ProductStatus } from "@prisma/client"
import { bulkCreateProducts } from "./actions"
import { Plus, Trash2, Loader2, Save, Keyboard } from "lucide-react"
import { useRef, useEffect } from "react"

// Translation Maps (Synced with product-form.tsx)
const TYPE_LABEL: Record<string, string> = {
    REGULAR: "정규",
    DAILY: "데일리",
    SPECIAL: "스페셜",
    LUNCH_BOX: "도시락",
    SALAD: "샐러드",
}

const CATEGORY_LABEL: Record<string, string> = {
    TODAY_MENU: "오늘의 메뉴",
    MAIN_DISH: "요리 곁들임",
    SOUP: "국물 곁들임",
    SIDE_DISH: "반찬 곁들임",
    KIMCHI: "김치 곁들임",
    PICKLE: "장아찌 곁들임",
    SAUCE: "청/소스 곁들임",
    LUNCH_RICE: "도시락 밥",
    LUNCH_SOUP: "도시락 국",
    LUNCH_MAIN: "도시락 메인",
    LUNCH_SIDE: "도시락 반찬",
    SALAD_MAIN: "샐러드 메인",
}

const WORK_DIVISION_LABEL: Record<string, string> = {
    IMMEDIATE_SUB_PORTIONING: "즉시소분",
    COOKING: "조리필요",
    PROCESSING: "전처리/가공",
}

const STATUS_LABEL: Record<string, string> = {
    SELLING: "판매중",
    NOT_SELLING: "판매중지",
    PENDING: "보류(품절)",
}

export function BulkProductForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Common Settings
    const [commonType, setCommonType] = useState<ProductType>(ProductType.REGULAR)
    const [commonCategory, setCommonCategory] = useState<ProductCategory>(ProductCategory.SIDE_DISH)
    const [commonWorkDivision, setCommonWorkDivision] = useState<WorkDivision>(WorkDivision.IMMEDIATE_SUB_PORTIONING)
    const [commonStatus, setCommonStatus] = useState<ProductStatus>(ProductStatus.SELLING)

    // Items List
    const [items, setItems] = useState([{ name: "", basePrice: 0, description: "" }])
    const firstNameInputRef = useRef<HTMLInputElement>(null)

    const addItem = () => {
        setItems([...items, { name: "", basePrice: 0, description: "" }])
    }

    // Auto-focus the first input of the newly added row
    useEffect(() => {
        if (items.length > 1) {
            firstNameInputRef.current?.focus()
        }
    }, [items.length])
    const removeItem = (index: number) => {
        if (items.length === 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: 'name' | 'basePrice' | 'description', value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const onSubmit = async () => {
        const validItems = items.filter(item => item.name.trim() !== "")
        if (validItems.length === 0) {
            alert("등록할 상품명을 최소 하나 이상 입력해주세요.")
            return
        }

        setLoading(true)
        try {
            const result = await bulkCreateProducts(
                {
                    type: commonType,
                    category: commonCategory,
                    workDivision: commonWorkDivision,
                    status: commonStatus
                },
                validItems
            )

            if (result.success) {
                alert(`${result.count}개의 상품이 성공적으로 등록되었습니다.`)
                router.push("/admin/products")
                router.refresh()
            } else {
                alert("등록 실패: " + result.error)
            }
        } catch (error) {
            console.error(error)
            alert("오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'name' | 'basePrice' | 'description') => {
        // Enter to submit
        if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
            return
        }

        // Tab on the last field of the last row to add a new row
        if (e.key === 'Tab' && !e.shiftKey && index === items.length - 1 && field === 'description') {
            e.preventDefault()
            addItem()
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Keyboard className="w-4 h-4" />
                    <span>팁: [Tab]으로 행 추가, [Enter]로 즉시 저장</span>
                </div>
            </div>
            {/* Common Settings Card */}
            <Card className="border-orange-100 bg-orange-50/10">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs">1</div>
                        공통 설정 (모든 상품에 적용됩니다)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>유형</Label>
                        <Select value={commonType} onValueChange={(v) => setCommonType(v as ProductType)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ProductType).map(t => (
                                    <SelectItem key={t} value={t}>{TYPE_LABEL[t] || t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>카테고리</Label>
                        <Select value={commonCategory} onValueChange={(v) => setCommonCategory(v as ProductCategory)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ProductCategory).map(c => (
                                    <SelectItem key={c} value={c}>{CATEGORY_LABEL[c] || c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>작업 구분</Label>
                        <Select value={commonWorkDivision} onValueChange={(v) => setCommonWorkDivision(v as WorkDivision)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(WorkDivision).map(d => (
                                    <SelectItem key={d} value={d}>{WORK_DIVISION_LABEL[d] || d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>판매 상태</Label>
                        <Select value={commonStatus} onValueChange={(v) => setCommonStatus(v as ProductStatus)}>
                            <SelectTrigger className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(ProductStatus).map(s => (
                                    <SelectItem key={s} value={s}>{STATUS_LABEL[s] || s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Items List Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</div>
                        상품 리스트 입력
                    </CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="bg-white">
                        <Plus className="mr-2 h-4 w-4" /> 줄 추가
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left w-12">No</th>
                                    <th className="px-6 py-3 text-left">상품명</th>
                                    <th className="px-6 py-3 text-left w-32">가격 (원)</th>
                                    <th className="px-6 py-3 text-left">설명 (레시피 팁)</th>
                                    <th className="px-6 py-3 text-center w-20">삭제</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <Input
                                                ref={index === items.length - 1 ? firstNameInputRef : null}
                                                placeholder="예: 어향가지덮밥"
                                                value={item.name}
                                                className="border-transparent focus:border-slate-200 bg-transparent hover:bg-white"
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'name')}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="0"
                                                    value={item.basePrice === 0 ? "" : item.basePrice}
                                                    className="border-transparent focus:border-slate-200 bg-transparent hover:bg-white pr-7 text-right"
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '')
                                                        updateItem(index, 'basePrice', val === '' ? 0 : Number(val))
                                                    }}
                                                    onKeyDown={(e) => handleKeyDown(e, index, 'basePrice')}
                                                />
                                                <span className="absolute right-2 top-2.5 text-slate-400 text-[10px]">원</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Input
                                                placeholder="레시피 팁 또는 간단 설명"
                                                value={item.description}
                                                className="border-transparent focus:border-slate-200 bg-transparent hover:bg-white"
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-destructive"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {items.length > 5 && (
                        <div className="p-4 border-t flex justify-center">
                            <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-slate-500">
                                <Plus className="mr-2 h-4 w-4" /> 아래에 줄 추가
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-8">
                <Button variant="outline" onClick={() => router.back()} disabled={loading} className="px-6">
                    취소
                </Button>
                <Button onClick={onSubmit} disabled={loading} className="px-10 bg-orange-600 hover:bg-orange-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    일괄 등록 완료
                </Button>
            </div>
        </div>
    )
}
