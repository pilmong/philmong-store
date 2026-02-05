'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useState, useEffect } from "react"
import { getMenuPlans, getAvailableProducts, upsertMenuPlan, deleteMenuPlan, createProductAndPlan, updateMenuPlanDescription, copyMenuPlans, type MenuPlanInput } from "./actions"
import { Product, MenuPlan, ProductType, ProductCategory, WorkDivision, ProductStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Loader2, Copy, Search, BookOpen, UtensilsCrossed, Save, Pencil } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"
import { LunchBoxGuide } from "../components/lunchbox-guide"
import { SaladViewer } from "../components/salad-viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

type MenuPlanWithProduct = MenuPlan & { product: Product }

const CATEGORY_LABELS = {
    LUNCH_MAIN: "도시락 메인",
    LUNCH_SOUP: "도시락 국",
    LUNCH_RICE: "도시락 밥",
    LUNCH_SIDE: "도시락 반찬",
    SALAD_MAIN: "샐러드 메인",
    TODAY_MENU: "오늘의 메뉴",
    MAIN_DISH: "요리 곁들임",
    SOUP: "국물 곁들임",
    SIDE_DISH: "반찬 곁들임",
    KIMCHI: "김치 곁들임",
    PICKLE: "장아찌 곁들임",
    SAUCE: "청/소스 곁들임"
} as Record<string, string>

export function MenuCalendar() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [plans, setPlans] = useState<MenuPlanWithProduct[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(false)
    const [isAdding, setIsAdding] = useState(false)

    // Quick Search State
    const [searchOpen, setSearchOpen] = useState(false)
    const [activeSlotFilter, setActiveSlotFilter] = useState<string[]>([])
    const [activeTypeFilter, setActiveTypeFilter] = useState<string[]>([])

    // Detailed Create/Edit Dialog State
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editProductDialogOpen, setEditProductDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Form State (New Product)
    const [newProductName, setNewProductName] = useState("")
    const [newProductPrice, setNewProductPrice] = useState(0)
    const [newProductType, setNewProductType] = useState<ProductType>("LUNCH_BOX")
    const [newProductCategory, setNewProductCategory] = useState<ProductCategory>("LUNCH_MAIN")
    const [newProductWorkDivision, setNewProductWorkDivision] = useState<WorkDivision>("IMMEDIATE_SUB_PORTIONING")
    const [newProductDescription, setNewProductDescription] = useState("")

    // Old Form State (Add Existing)
    const [selectedProductId, setSelectedProductId] = useState("")
    const [price, setPrice] = useState(0)
    const [quantityLimit, setQuantityLimit] = useState<number | undefined>(undefined)
    const [description, setDescription] = useState("")

    // Library Search State
    const [searchQuery, setSearchQuery] = useState("")

    // Edit State
    const [editingSlot, setEditingSlot] = useState<{ label: string, id?: string, type: 'PRODUCT' | 'TEXT' }>({ label: '', type: 'PRODUCT' })
    const [textEditOpen, setTextEditOpen] = useState(false)
    const [textInputValue, setTextInputValue] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [activePlannerTab, setActivePlannerTab] = useState("lunchbox")

    useEffect(() => {
        loadProducts()
    }, [])

    useEffect(() => {
        if (date) {
            fetchPlans(date)
        }
    }, [date])

    async function loadProducts() {
        const res = await getAvailableProducts()
        if (res.success && res.data) setProducts(res.data)
    }

    async function fetchPlans(targetDate: Date) {
        setLoading(true)
        const res = await getMenuPlans(targetDate)
        if (res.success && res.data) setPlans(res.data)
        setLoading(false)
    }

    async function handleAddPlan() {
        if (!date || !selectedProductId) return

        const input: MenuPlanInput = {
            planDate: date,
            productId: selectedProductId,
            price: price,
            quantityLimit: quantityLimit,
            descriptionOverride: description
        }

        setIsSaving(true)
        const res = await upsertMenuPlan(input)
        if (res.success && res.allPlans) {
            setPlans(res.allPlans as any)
        }
        setIsSaving(false)
        setIsAdding(false)
        setSelectedProductId("")
        setPrice(0)
        setDescription("")
    }

    async function handleDelete(id: string) {
        if (!confirm("정말 삭제하시겠습니까?")) return
        const previousPlans = [...plans]
        setPlans(plans.filter(p => p.id !== id))
        const res = await deleteMenuPlan(id)
        if (!res.success) {
            alert("삭제에 실패했습니다. 다시 시도해 주세요.")
            setPlans(previousPlans)
        } else if (res.allPlans) {
            setPlans(res.allPlans as any)
        }
    }

    const handleProductSelect = (pid: string) => {
        setSelectedProductId(pid)
        const p = products.find(x => x.id === pid)
        if (p) setPrice(p.basePrice)
    }

    const handleSlotClick = (label: string, id: string | undefined, type: 'PRODUCT' | 'TEXT') => {
        if (id && type === 'PRODUCT') {
            if (confirm(`${label} 메뉴를 삭제하시겠습니까?`)) {
                handleDelete(id)
            }
            return
        }

        setEditingSlot({ label, id, type })

        if (type === 'PRODUCT') {
            let filterVals: string[] = []
            if (label === '메인') filterVals = ['LUNCH_MAIN']
            else if (label === '국') filterVals = ['LUNCH_SOUP']
            else if (label === '밥') filterVals = ['LUNCH_RICE']
            else if (label.startsWith('반찬')) filterVals = ['LUNCH_SIDE']
            else if (label === '샐러드 메인') filterVals = ['SALAD_MAIN']
            else if (label === '데일리') filterVals = ['TODAY_MENU', 'MAIN_DISH', 'SOUP', 'SIDE_DISH', 'KIMCHI', 'PICKLE']
            else if (label === '스페셜') filterVals = ['TODAY_MENU', 'MAIN_DISH']

            setActiveSlotFilter(filterVals)
            if (label === '데일리') setActiveTypeFilter(['DAILY'])
            else if (label === '스페셜') setActiveTypeFilter(['SPECIAL'])
            else if (label === '샐러드 메인' || label === '재료') setActiveTypeFilter(['SALAD'])
            else setActiveTypeFilter(['LUNCH_BOX'])

            setSearchOpen(true)
        } else {
            if (id) {
                const plan = plans.find(p => p.id === id)
                setTextInputValue(plan?.descriptionOverride || "")
            } else {
                setTextInputValue("")
            }
            setTextEditOpen(true)
        }
    }

    const handleTextSave = async () => {
        if (!textInputValue.trim() || !date) {
            setTextEditOpen(false)
            return
        }
        setIsSaving(true)
        let targetId = editingSlot.id
        if (editingSlot.label === '재료' && !targetId) {
            const res = await createProductAndPlan("오늘의 샐러드", "SALAD", "MAIN_DISH", date, 7000)
            if (res.success && res.plan) targetId = res.plan.id
            else { alert("샐러드 메뉴 생성에 실패했습니다."); return }
        }
        if (!targetId) { setTextEditOpen(false); return }
        const previousPlans = [...plans]
        setPlans(plans.map(p => p.id === targetId ? { ...p, descriptionOverride: textInputValue } : p))
        setTextEditOpen(false)
        const res = await updateMenuPlanDescription(targetId, textInputValue)
        if (res.success && res.allPlans) setPlans(res.allPlans as any)
        else { alert("저장에 실패했습니다."); setPlans(previousPlans) }
        setIsSaving(false)
    }

    const handleCreateNew = async (name: string) => {
        if (!name.trim() || !date) return
        let type = activeTypeFilter.length > 0 ? activeTypeFilter[0] : 'LUNCH_BOX'
        let category = activeSlotFilter.length > 0 ? activeSlotFilter[0] : 'LUNCH_MAIN'
        if (type === 'REGULAR') type = 'LUNCH_BOX'
        if (type === 'LUNCH_BOX' && category === 'MAIN_DISH') category = 'LUNCH_MAIN'

        setIsSaving(true)
        const res = await createProductAndPlan(name, type as ProductType, category as ProductCategory, date, 0)
        setIsSaving(false)
        if (res.success && res.allPlans) { setPlans(res.allPlans as any); loadProducts() }
        else { alert("메뉴 생성에 실패했습니다.") }
        setSearchOpen(false)
        setSearchQuery("")
    }

    // New Detailed Registration Handler
    const openCreateDialog = () => {
        setNewProductName(searchQuery)
        // Auto-assign type based on active tab
        let type: ProductType = "LUNCH_BOX"
        let cat: ProductCategory = "LUNCH_MAIN"

        if (activePlannerTab === 'salad') { type = "SALAD"; cat = "SALAD_MAIN" }
        else if (activePlannerTab === 'daily') { type = "DAILY"; cat = "TODAY_MENU" }
        else if (activePlannerTab === 'special') { type = "SPECIAL"; cat = "TODAY_MENU" }

        setNewProductType(type)
        setNewProductCategory(cat)
        setNewProductPrice(0)
        setNewProductDescription("")
        setCreateDialogOpen(true)
    }

    const handleDetailedCreate = async () => {
        if (!newProductName.trim() || !date) return
        setIsSaving(true)
        const res = await createProductAndPlan(newProductName, newProductType, newProductCategory, date, newProductPrice)
        if (res.success) {
            if (newProductDescription && res.plan) {
                await updateMenuPlanDescription(res.plan.id, newProductDescription)
            }
            const finalRes = await getMenuPlans(date)
            if (finalRes.success && finalRes.data) setPlans(finalRes.data)
            loadProducts()
            setCreateDialogOpen(false)
            setSearchQuery("")
        } else {
            alert("상품 등록에 실패했습니다.")
        }
        setIsSaving(false)
    }

    const openEditProductDialog = (p: Product, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProduct(p)
        setNewProductName(p.name)
        setNewProductPrice(p.basePrice)
        setNewProductType(p.type)
        setNewProductCategory(p.category || "LUNCH_MAIN" as ProductCategory)
        setNewProductDescription(p.description || "")
        setEditProductDialogOpen(true)
    }

    const handleUpdateProduct = async () => {
        if (!editingProduct || !newProductName.trim()) return
        setIsSaving(true)
        const { updateProduct } = await import("./actions") // Lazy or direct
        const res = await updateProduct(editingProduct.id, {
            name: newProductName,
            basePrice: newProductPrice,
            type: newProductType,
            category: newProductCategory,
            description: newProductDescription
        })
        if (res.success) {
            alert("상품 정보가 수정되었습니다.")
            loadProducts()
            if (date) {
                const plansRes = await getMenuPlans(date)
                if (plansRes.success && plansRes.data) setPlans(plansRes.data)
            }
            setEditProductDialogOpen(false)
        } else {
            alert("수정에 실패했습니다.")
        }
        setIsSaving(false)
    }

    const handleCopy = async () => {
        if (!date) return
        const sourceDate = new Date(date)
        sourceDate.setDate(sourceDate.getDate() - 1)
        if (!confirm(`${format(sourceDate, "M월 d일")}의 식단을 오늘로 복사하시겠습니까?\n(오늘의 기존 식단은 모두 삭제됩니다)`)) return
        setIsSaving(true)
        const res = await copyMenuPlans(sourceDate, date)
        setIsSaving(false)
        if (res.success && res.allPlans) { setPlans(res.allPlans as any); alert("식단 복사가 완료되었습니다.") }
        else { alert(res.error || "식단 복사에 실패했습니다.") }
    }

    const onLibraryItemClick = async (product: Product) => {
        if (!date) return
        const existingPlan = plans.find(p => p.productId === product.id)
        if (existingPlan) {
            setIsSaving(true)
            const res = await deleteMenuPlan(existingPlan.id)
            if (res.success && res.allPlans) setPlans(res.allPlans as any)
            else alert("삭제에 실패했습니다.")
            setIsSaving(false)
            return
        }
        const input: MenuPlanInput = { planDate: date, productId: product.id, price: product.basePrice }
        setIsSaving(true)
        const res = await upsertMenuPlan(input)
        if (res.success && res.allPlans) setPlans(res.allPlans as any)
        else alert("저장에 실패했습니다.")
        setIsSaving(false)
    }

    const categoriesList = React.useMemo(() => {
        const groups: Record<string, Product[]> = {}
        if (activePlannerTab === 'lunchbox') groups['LUNCH_BOX'] = products.filter(p => p.type === 'LUNCH_BOX')
        else if (activePlannerTab === 'salad') groups['SALAD'] = products.filter(p => p.type === 'SALAD' || p.category === 'SALAD_MAIN')
        else if (activePlannerTab === 'daily') groups['DAILY'] = products.filter(p => p.type === 'DAILY')
        else if (activePlannerTab === 'special') groups['SPECIAL'] = products.filter(p => p.type === 'SPECIAL')
        return groups
    }, [products, activePlannerTab])

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                        <UtensilsCrossed className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {date ? format(date, "yyyy년 M월 d일 (EEE)", { locale: ko }) : "날짜를 선택하세요"}
                        </h1>
                        <p className="text-sm text-muted-foreground">사장님의 메뉴 기획실</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={isSaving}>
                    <Copy className="w-4 h-4 mr-2" /> 전일 식단 가져오기
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* 1. Left: Calendar */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">📅 일정 선택</CardTitle></CardHeader>
                        <CardContent className="flex justify-center p-0 pb-4">
                            <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" locale={ko} />
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm bg-orange-50/30 border-orange-100">
                        <CardHeader className="pb-2"><CardTitle className="text-xs font-bold text-orange-700">기획 팁</CardTitle></CardHeader>
                        <CardContent className="text-xs text-orange-600 leading-relaxed">
                            라이브러리 검색창에 메뉴 이름을 입력하고 없으면 '등록' 버튼을 눌러 바로 상품을 만들 수 있습니다.
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Center: Planner */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                    <Card className="shadow-sm overflow-hidden border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b pb-4">
                            <Tabs value={activePlannerTab} onValueChange={setActivePlannerTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-white border">
                                    <TabsTrigger value="lunchbox" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">🍱 도시락</TabsTrigger>
                                    <TabsTrigger value="salad" className="data-[state=active]:bg-green-700 data-[state=active]:text-white">🥗 샐러드</TabsTrigger>
                                    <TabsTrigger value="daily" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white">🍛 데일리</TabsTrigger>
                                    <TabsTrigger value="special" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">🎉 특별</TabsTrigger>
                                </TabsList>
                                <div className="mt-6">
                                    <TabsContent value="lunchbox">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300">
                                            <div className="flex justify-center">
                                                <LunchBoxGuide
                                                    onSlotClick={(lbl, id) => handleSlotClick(lbl, id, 'PRODUCT')}
                                                    slots={(() => {
                                                        const slots = { rice: { text: "잡곡밥", isEmpty: false }, soup: { text: "", isEmpty: true }, main: { text: "", isEmpty: true }, side1: { text: "", isEmpty: true }, side2: { text: "", isEmpty: true }, side3: { text: "", isEmpty: true } }
                                                        const sides: any[] = []
                                                        plans.filter(p => p.product.type === 'LUNCH_BOX').forEach(p => {
                                                            const cat = p.product.category as string
                                                            const item = { id: p.id, text: p.product.name, isEmpty: false }
                                                            if (cat === 'LUNCH_RICE') slots.rice = item
                                                            else if (cat === 'LUNCH_SOUP') slots.soup = item
                                                            else if (cat === 'LUNCH_MAIN') slots.main = item
                                                            else if (cat === 'LUNCH_SIDE') sides.push(item)
                                                        })
                                                        if (sides.length > 0) slots.side1 = sides[0]; if (sides.length > 1) slots.side2 = sides[1]; if (sides.length > 2) slots.side3 = sides[2]
                                                        return slots
                                                    })()}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="salad">
                                        <div className="bg-green-50/50 p-6 rounded-xl border border-dashed border-green-200">
                                            <div className="flex justify-center">
                                                <SaladViewer
                                                    onSlotClick={(key, id) => { if (key === 'main') handleSlotClick('샐러드 메인', id, 'PRODUCT'); else handleSlotClick('재료', id, 'TEXT') }}
                                                    main={(() => {
                                                        const p = plans.find(x => (x.product.category as string) === 'SALAD_MAIN' || x.product.type === 'SALAD')
                                                        return p ? { id: p.id, text: p.product.name, isEmpty: false } : { text: "눌러서 선택", isEmpty: true }
                                                    })()}
                                                    ingredients={(() => {
                                                        const p = plans.find(x => (x.product.category as string) === 'SALAD_MAIN' || x.product.type === 'SALAD')
                                                        return p ? { id: p.id, text: p.descriptionOverride || p.product.description || "재료 입력", isEmpty: false } : { text: "", isEmpty: true }
                                                    })()}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="daily">
                                        <div className="grid grid-cols-1 gap-2">
                                            {plans.filter(p => p.product.type === 'DAILY').map(p => (
                                                <div key={p.id} className="p-4 flex justify-between items-center bg-white border rounded-lg shadow-sm">
                                                    <span className="font-medium">{p.product.name}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="special">
                                        <div className="grid grid-cols-1 gap-2">
                                            {plans.filter(p => p.product.type === 'SPECIAL').map(p => (
                                                <div key={p.id} className="p-4 flex justify-between items-center bg-white border rounded-lg shadow-sm">
                                                    <span className="font-medium">{p.product.name}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </CardHeader>
                    </Card>
                </div>

                {/* 3. Right: Library */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <Card className="shadow-sm h-[calc(100vh-280px)] flex flex-col border-slate-200">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-orange-600" /> 메뉴 라이브러리
                            </CardTitle>
                            <div className="flex gap-1.5 mt-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="메뉴 찾기..."
                                        className="pl-8 h-8 text-xs bg-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700"
                                    onClick={openCreateDialog}
                                >
                                    <Plus className="w-4 h-4 mr-1" /> 등록
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
                            <div className="p-3 space-y-4">
                                {Object.entries(categoriesList).map(([key, items]) => {
                                    const filteredItems = items.filter(p => !searchQuery || p.name.includes(searchQuery))
                                    if (filteredItems.length === 0) return null
                                    return (
                                        <div key={key} className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase px-1">{key}</h4>
                                            <div className="grid grid-cols-1 gap-1">
                                                {filteredItems.map(p => {
                                                    const isAdded = plans.some(plan => plan.productId === p.id)
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => onLibraryItemClick(p)}
                                                            className={cn(
                                                                "text-left px-3 py-2 text-xs rounded-md border flex justify-between items-center group cursor-pointer transition-colors",
                                                                isAdded ? "bg-slate-100 border-slate-300 font-medium" : "bg-white hover:bg-orange-50"
                                                            )}
                                                        >
                                                            <span className="truncate flex-1">{p.name}</span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 hover:bg-slate-200"
                                                                    onClick={(e) => openEditProductDialog(p, e)}
                                                                >
                                                                    <Pencil className="w-3 h-3 text-slate-500" />
                                                                </Button>
                                                                {isAdded ? (
                                                                    <Trash2 className="w-3 h-3 text-red-300 hover:text-red-500" />
                                                                ) : (
                                                                    <Plus className="w-3 h-3 text-slate-300 hover:text-orange-500" />
                                                                )}
                                                            </div>
                                                            {isAdded && !isSaving && (
                                                                <div className="flex items-center gap-1 ml-2 group-hover:hidden">
                                                                    <Badge variant="secondary" className="px-1 h-4 text-[9px] bg-slate-200 text-slate-600">등록됨</Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Improved Detailed Registration Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>새 상품 등록</DialogTitle>
                        <DialogDescription>상품의 상세 정보를 입력해 주세요.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">상품명</Label>
                            <Input id="name" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">기준 가격</Label>
                            <Input id="price" type="number" value={newProductPrice} onChange={e => setNewProductPrice(Number(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">유형</Label>
                            <Select value={newProductType} onValueChange={(v: any) => setNewProductType(v)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent position="popper" className="max-h-[500px]">
                                    <SelectItem value="LUNCH_BOX">도시락</SelectItem>
                                    <SelectItem value="SALAD">샐러드</SelectItem>
                                    <SelectItem value="DAILY">데일리</SelectItem>
                                    <SelectItem value="SPECIAL">특별</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">카테고리</Label>
                            <Select value={newProductCategory} onValueChange={(v: any) => setNewProductCategory(v)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent position="popper" className="max-h-[500px]">
                                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">설명/레시피</Label>
                            <Input value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} className="col-span-3" placeholder="레시피 팁이나 상세 설명" />
                        </div>
                    </div>
                    <Button onClick={handleDetailedCreate} disabled={isSaving}>등록 및 식단 추가</Button>
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={editProductDialogOpen} onOpenChange={setEditProductDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>상품 정보 수정</DialogTitle>
                        <DialogDescription>상품의 기본 정보를 변경합니다.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">상품명</Label>
                            <Input id="edit-name" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">기준 가격</Label>
                            <Input id="edit-price" type="number" value={newProductPrice} onChange={e => setNewProductPrice(Number(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">유형</Label>
                            <Select value={newProductType} onValueChange={(v: any) => setNewProductType(v)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent position="popper" className="max-h-[500px]">
                                    <SelectItem value="LUNCH_BOX">도시락</SelectItem>
                                    <SelectItem value="SALAD">샐러드</SelectItem>
                                    <SelectItem value="DAILY">데일리</SelectItem>
                                    <SelectItem value="SPECIAL">특별</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">카테고리</Label>
                            <Select value={newProductCategory} onValueChange={(v: any) => setNewProductCategory(v)}>
                                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                                <SelectContent position="popper" className="max-h-[500px]">
                                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">설명/레시피</Label>
                            <Input value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} className="col-span-3" placeholder="레시피 팁이나 상세 설명" />
                        </div>
                    </div>
                    <Button onClick={handleUpdateProduct} disabled={isSaving}>수정 사항 저장</Button>
                </DialogContent>
            </Dialog>

            {/* Other Dialogs (Search, Text Edit) */}
            <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
                <CommandInput placeholder="검색..." value={searchQuery} onValueChange={setSearchQuery} />
                <CommandList>
                    <CommandEmpty><Button variant="outline" size="sm" onClick={() => handleCreateNew(searchQuery)}>"{searchQuery}" 새로 만들기</Button></CommandEmpty>
                    <CommandGroup>
                        {products.filter(p => (!searchQuery || p.name.includes(searchQuery)) && (activeSlotFilter.length === 0 || activeSlotFilter.includes(p.category as string || ''))).map(p => (
                            <CommandItem key={p.id} value={p.name} onSelect={async () => { setSearchOpen(false); onLibraryItemClick(p); }}>{p.name}</CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>

            <Dialog open={textEditOpen} onOpenChange={setTextEditOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingSlot.label} 입력</DialogTitle></DialogHeader>
                    <Input value={textInputValue} onChange={e => setTextInputValue(e.target.value)} placeholder="내용 입력..." onKeyDown={e => e.key === 'Enter' && handleTextSave()} className="my-4" />
                    <Button onClick={handleTextSave} disabled={isSaving}>저장</Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
