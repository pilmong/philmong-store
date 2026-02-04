'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createProduct, updateProduct, deleteProduct } from "./actions"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ProductType, ProductCategory, WorkDivision, ProductStatus, Product } from "@prisma/client"

const STORAGE_KEY = "philmong_last_product_fields"

// Zod Schema
const formSchema = z.object({
    name: z.string().min(1, "상품명을 입력해주세요."),
    basePrice: z.coerce.number().min(0, "가격은 0원 이상이어야 합니다."),
    type: z.nativeEnum(ProductType),
    category: z.nativeEnum(ProductCategory),
    description: z.string().optional(),
    workDivision: z.nativeEnum(WorkDivision),
    status: z.nativeEnum(ProductStatus),
    standardQuantity: z.coerce.number().optional()
})

// Translation Maps
const TYPE_LABEL: Record<string, string> = {
    REGULAR: "정규",
    DAILY: "데일리",
    SPECIAL: "스페셜",
    LUNCH_BOX: "도시락",
    SALAD: "샐러드",
}

const CATEGORY_LABEL: Record<string, string> = {
    MAIN_DISH: "메인요리",
    SOUP: "국/찌개",
    SIDE_DISH: "반찬",
    KIMCHI: "김치",
    PICKLE: "절임/젓갈",
    SAUCE: "소스/양념",
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

interface ProductFormProps {
    initialData?: Product
}

export function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Fallback values for nullable fields from DB
    const defaultValues: z.infer<typeof formSchema> = {
        name: initialData?.name || "",
        basePrice: initialData?.basePrice || 0,
        type: initialData?.type || ProductType.REGULAR,
        category: initialData?.category || ProductCategory.SIDE_DISH,
        description: initialData?.description || "",
        workDivision: initialData?.workDivision || WorkDivision.IMMEDIATE_SUB_PORTIONING,
        status: initialData?.status || ProductStatus.SELLING,
        standardQuantity: initialData?.standardQuantity || 0
    }

    const form = useForm<z.infer<typeof formSchema>>({
        // Cast resolver to any to fix persistent type incompatibility issues in dev environment
        // The runtime validation still works correctly
        resolver: zodResolver(formSchema) as any,
        defaultValues,
    })

    // Load from localStorage for new products
    useEffect(() => {
        if (!initialData) {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    // Use setValue to preserve other default values and ensure UI update
                    if (parsed.type) form.setValue("type", parsed.type)
                    if (parsed.category) form.setValue("category", parsed.category)
                    if (parsed.workDivision) form.setValue("workDivision", parsed.workDivision)
                } catch (e) {
                    console.error("Failed to load saved product fields", e)
                }
            }
        }
    }, [initialData, form])

    // Keyboard Shortcut: Ctrl + S to Save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault()
                form.handleSubmit(onSubmit)()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [form, onSubmit])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            if (initialData) {
                const result = await updateProduct(initialData.id, {
                    ...values,
                    description: values.description || undefined,
                    standardQuantity: values.standardQuantity || undefined
                })
                if (result.success) {
                    alert("상품이 수정되었습니다.")
                    router.push("/admin/products")
                    router.refresh()
                } else {
                    alert("수정 실패: " + result.error)
                }
            } else {
                const result = await createProduct({
                    ...values,
                    description: values.description || undefined,
                    standardQuantity: values.standardQuantity || undefined
                })
                if (result.success) {
                    // Save fields to localStorage for next time
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        type: values.type,
                        category: values.category,
                        workDivision: values.workDivision
                    }))

                    alert("상품이 등록되었습니다.")
                    router.push("/admin/products")
                    router.refresh()
                } else {
                    alert("등록 실패: " + result.error)
                }
            }
        } catch (error) {
            console.error(error)
            alert("오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    async function onDelete() {
        if (!initialData || !confirm("정말 이 상품을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return
        setLoading(true)
        const result = await deleteProduct(initialData.id)
        if (result.success) {
            alert("상품이 삭제되었습니다.")
            router.push("/admin/products")
            router.refresh()
        } else {
            alert("삭제 실패: " + result.error)
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>상품명</FormLabel>
                            <FormControl>
                                <Input placeholder="예: 어향가지덮밥" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>기본 가격 (원)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '')
                                            field.onChange(val === '' ? 0 : Number(val))
                                        }}
                                        value={field.value.toString()}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="standardQuantity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>기준 수량 (선택)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        {...field}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '')
                                            field.onChange(val === '' ? undefined : Number(val))
                                        }}
                                        value={(field.value ?? "").toString()}
                                    />
                                </FormControl>
                                <FormDescription>진열 상품의 경우 기준 수량 입력</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>상품 유형</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="유형 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(ProductType).map((type) => (
                                            <SelectItem key={type} value={type}>{TYPE_LABEL[type] || type}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>카테고리</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="카테고리 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(ProductCategory).map((cat) => (
                                            <SelectItem key={cat} value={cat}>{CATEGORY_LABEL[cat] || cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="workDivision"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>작업 구분</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="작업 구분 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(WorkDivision).map((div) => (
                                            <SelectItem key={div} value={div}>{WORK_DIVISION_LABEL[div] || div}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>판매 상태</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="상태 선택" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(ProductStatus).map((status) => (
                                            <SelectItem key={status} value={status}>{STATUS_LABEL[status] || status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>설명 (레시피 팁)</FormLabel>
                            <FormControl>
                                <Input placeholder="간략한 설명" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        취소
                    </Button>
                    <div className="flex gap-2">
                        {initialData && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={onDelete}
                                disabled={loading}
                            >
                                삭제
                            </Button>
                        )}
                        <Button type="submit" disabled={loading}>
                            {initialData ? "수정 저장" : "상품 등록"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
