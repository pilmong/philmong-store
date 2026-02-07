'use client'

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getSystemPolicy, updateSystemPolicy } from "./actions"
import { Clock, Save, Building2, Store, CalendarDays, AlertTriangle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function SettingsPage() {
    const [b2bDeadline, setB2bDeadline] = useState("15")
    const [b2cDeadline, setB2cDeadline] = useState("15")
    const [b2bBasis, setB2bBasis] = useState("PREVIOUS")
    const [b2cBasis, setB2cBasis] = useState("PREVIOUS")
    const [b2cShowLunchSalad, setB2cShowLunchSalad] = useState("ON")
    const [b2cOpenHour, setB2cOpenHour] = useState("20")
    const [b2cCloseHour, setB2cCloseHour] = useState("18")
    const [b2cStorePause, setB2cStorePause] = useState("OFF")
    const [b2cPauseMessage, setB2cPauseMessage] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const loadSettings = async () => {
            const b2b = await getSystemPolicy("B2B_DEADLINE_HOUR", "15")
            const b2c = await getSystemPolicy("B2C_DEADLINE_HOUR", "15")
            const b2bBase = await getSystemPolicy("B2B_DEADLINE_BASIS", "PREVIOUS")
            const b2cBase = await getSystemPolicy("B2C_DEADLINE_BASIS", "PREVIOUS")
            const b2cShow = await getSystemPolicy("B2C_SHOW_LUNCH_SALAD", "ON")
            const b2cOpen = await getSystemPolicy("B2C_OPEN_HOUR", "20")
            const b2cClose = await getSystemPolicy("B2C_CLOSE_HOUR", "18")
            const b2cPause = await getSystemPolicy("B2C_STORE_PAUSE", "OFF")
            const b2cMsg = await getSystemPolicy("B2C_STORE_PAUSE_MESSAGE", "현재 매장 사정으로 인해 잠시 주문을 중단합니다. 이용에 불편을 드려 죄송합니다.")

            setB2bDeadline(b2b)
            setB2cDeadline(b2c)
            setB2bBasis(b2bBase)
            setB2cBasis(b2cBase)
            setB2cShowLunchSalad(b2cShow)
            setB2cOpenHour(b2cOpen)
            setB2cCloseHour(b2cClose)
            setB2cStorePause(b2cPause)
            setB2cPauseMessage(b2cMsg)
            setLoading(false)
        }
        loadSettings()
    }, [])

    const handleSave = async (key: string, value: string) => {
        setSaving(true)

        if (key.endsWith("_HOUR")) {
            const numValue = parseInt(value)
            if (isNaN(numValue) || numValue < 0 || numValue > 23) {
                toast.error("0시에서 23시 사이의 숫자를 입력해주세요.")
                setSaving(false)
                return
            }
        }

        const res = await updateSystemPolicy(key, value)
        if (res.success) {
            toast.success("설정이 저장되었습니다.")
        } else {
            toast.error(res.error)
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">설정을 불러오는 중...</div>
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
                    <p className="text-muted-foreground mt-1">필몽 운영에 필요한 정책을 관리합니다.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 select-none">
                {/* B2B Settings */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl">B2B 주문 정책</CardTitle>
                        </div>
                        <CardDescription className="mt-2 text-xs">
                            기업 고객의 주문 수정 가능 여부를 결정하는 마감 기준일과 시각을 설정합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <CalendarDays className="h-3 w-3" />
                                        마감 기준일
                                    </Label>
                                    <Select value={b2bBasis} onValueChange={(val) => {
                                        setB2bBasis(val)
                                        handleSave("B2B_DEADLINE_BASIS", val)
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PREVIOUS">배송 전날 (PREV)</SelectItem>
                                            <SelectItem value="SAME">배송 당일 (SAME)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="b2b-deadline" className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Clock className="h-3 w-3" />
                                        마감 시각
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="b2b-deadline"
                                            type="number"
                                            min="0"
                                            max="23"
                                            value={b2bDeadline}
                                            onChange={(e) => setB2bDeadline(e.target.value)}
                                            className="h-10"
                                        />
                                        <Button
                                            onClick={() => handleSave("B2B_DEADLINE_HOUR", b2bDeadline)}
                                            disabled={saving}
                                            size="sm"
                                            variant="secondary"
                                            className="h-10 shrink-0"
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[12px] text-blue-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 font-medium">
                                ※ 현재 설정: <span className="underline underline-offset-4 decoration-blue-200">배송 {b2bBasis === "PREVIOUS" ? "전날" : "당일"} 오후 {b2bDeadline}시</span>에 마감
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* B2C Settings - 요청받은 대로 순서 및 디자인 개선 */}
                <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
                    <CardHeader className="bg-slate-900 text-white pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Store className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">B2C 스토어 운영 정책 관리</CardTitle>
                                <CardDescription className="text-slate-400">
                                    긴급 중단부터 카테고리 노출까지 한눈에 관리합니다.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {/* 1순위: 긴급 영업 중단 */}
                            <div className={cn(
                                "p-6 transition-all duration-300",
                                b2cStorePause === "ON" ? "bg-red-50" : "bg-white"
                            )}>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={cn(
                                        "p-2 rounded-lg shadow-sm border",
                                        b2cStorePause === "ON" ? "bg-red-600 text-white border-red-700" : "bg-white text-red-600 border-red-100"
                                    )}>
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">1. 긴급 영업 일시중단</Label>
                                        <p className="text-[11px] text-slate-400">마감 시각과 상관없이 즉시 주문을 차단합니다.</p>
                                    </div>
                                    {b2cStorePause === "ON" && (
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                            <span className="text-[11px] font-bold text-red-600">중단 가동중</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <Select value={b2cStorePause} onValueChange={(val) => {
                                        setB2cStorePause(val)
                                        handleSave("B2C_STORE_PAUSE", val)
                                    }}>
                                        <SelectTrigger className={cn(
                                            "h-12 text-base font-medium transition-all shadow-sm",
                                            b2cStorePause === "ON" ? "bg-red-600 text-white border-red-700 hover:bg-red-700" : "bg-white border-slate-200"
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OFF" className="font-medium">✅ 정상 운영 중 (영업중)</SelectItem>
                                            <SelectItem value="ON" className="text-red-600 font-bold">🚫 긴급 영업 중단 (주문 차단)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 ml-1">
                                            고객 노출 안내 문구
                                        </Label>
                                        <div className="flex gap-2">
                                            <Textarea
                                                value={b2cPauseMessage}
                                                onChange={(e) => setB2cPauseMessage(e.target.value)}
                                                placeholder="중단 시 고객에게 보여줄 문구를 입력하세요."
                                                className="min-h-[80px] bg-white border-slate-200 focus:ring-red-500 text-sm"
                                            />
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-auto px-4 shrink-0 transition-all active:scale-95 shadow-md"
                                                onClick={() => handleSave("B2C_STORE_PAUSE_MESSAGE", b2cPauseMessage)}
                                                disabled={saving}
                                            >
                                                <Save className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2순위: 자동 ON/OFF 시간 */}
                            <div className="p-6 bg-slate-50/40">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">2. 자동 운영 시각 설정 (Auto Sequence)</Label>
                                        <p className="text-[11px] text-slate-400">매일 반복되는 오픈과 정비 시간을 자동화합니다.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">자동 오픈</Label>
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        </div>
                                        <Select value={b2cOpenHour} onValueChange={(val) => {
                                            setB2cOpenHour(val)
                                            handleSave("B2C_OPEN_HOUR", val)
                                        }}>
                                            <SelectTrigger className="h-11 border-emerald-100 bg-emerald-50/30 text-emerald-900 font-semibold ring-offset-emerald-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <SelectItem key={i} value={i.toString()} className="font-medium text-slate-600">
                                                        {i >= 12 ? `오후 ${i === 12 ? 12 : i - 12}` : `오전 ${i}`}시
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-400 pl-1 leading-relaxed">
                                            🌙 전날 밤 <strong>{b2cOpenHour}시</strong>가 되면<br />내일 판매 메뉴가 자동으로 오픈됩니다.
                                        </p>
                                    </div>
                                    <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">자동 마감 (정비)</Label>
                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                                        </div>
                                        <Select value={b2cCloseHour} onValueChange={(val) => {
                                            setB2cCloseHour(val)
                                            handleSave("B2C_CLOSE_HOUR", val)
                                        }}>
                                            <SelectTrigger className="h-11 border-rose-100 bg-rose-50/30 text-rose-900 font-semibold ring-offset-rose-100">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <SelectItem key={i} value={i.toString()} className="font-medium text-slate-600">
                                                        {i >= 12 ? `오후 ${i === 12 ? 12 : i - 12}` : `오전 ${i}`}시
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[11px] text-slate-400 pl-1 leading-relaxed">
                                            🚧 당일 <strong>{b2cCloseHour}시</strong>가 되면<br />'메뉴 정비 중' 화면으로 자동 전환됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3순위: 주문 마감 시간 설정 */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 shadow-sm">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">3. 한끼든든 도시락/샐러드 주문마감</Label>
                                        <p className="text-[11px] text-slate-400">판매될 식단의 주문 마감 원칙을 정합니다.</p>
                                    </div>
                                </div>
                                <div className="space-y-4 p-5 bg-orange-50/30 rounded-2xl border border-orange-100 shadow-inner">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                                                마감 기준일
                                            </Label>
                                            <Select value={b2cBasis} onValueChange={(val) => {
                                                setB2cBasis(val)
                                                handleSave("B2C_DEADLINE_BASIS", val)
                                            }}>
                                                <SelectTrigger className="h-11 bg-white border-orange-100 shadow-sm font-medium">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PREVIOUS" className="font-medium text-slate-600">배송 전날 (PREVIOUS)</SelectItem>
                                                    <SelectItem value="SAME" className="font-medium text-slate-600">배송 당일 (SAME DAY)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                                                마감 시간
                                            </Label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="23"
                                                        value={b2cDeadline}
                                                        onChange={(e) => setB2cDeadline(e.target.value)}
                                                        className="h-11 bg-white border-orange-100 shadow-sm pr-7 text-center font-bold text-lg"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">시</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleSave("B2C_DEADLINE_HOUR", b2cDeadline)}
                                                    disabled={saving}
                                                    variant="secondary"
                                                    className="h-11 px-4 border border-orange-100 bg-white text-orange-600 hover:bg-orange-50 shadow-sm transition-all"
                                                >
                                                    <Save className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-2.5 px-4 bg-white/70 rounded-xl text-[12px] text-orange-800 font-bold border border-orange-100 flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-3 bg-orange-400 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-3 bg-orange-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                                            <div className="w-1.5 h-3 bg-orange-200 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        </div>
                                        <span>배송 {b2cBasis === "PREVIOUS" ? "전날" : "당일"} 오후 {b2cDeadline}시에 주문 마감 처리</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4순위: 한끼든든 카테고리 표시 */}
                            <div className="p-6 bg-slate-50/20">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 shadow-sm">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">4. 한끼든든 카테고리 표시 제어</Label>
                                        <p className="text-[11px] text-slate-400">특정 그룹 카테고리를 비공개하고 싶을 때 사용합니다.</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-700">스토어 메인 탭 노출 여부</p>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                            <span className="h-1 w-1 bg-slate-400 rounded-full" />
                                            비공개 테스트나 메뉴 정비가 길어질 때 활용하세요.
                                        </p>
                                    </div>
                                    <Select value={b2cShowLunchSalad} onValueChange={(val) => {
                                        setB2cShowLunchSalad(val)
                                        handleSave("B2C_SHOW_LUNCH_SALAD", val)
                                    }}>
                                        <SelectTrigger className={cn(
                                            "w-[130px] h-11 font-semibold",
                                            b2cShowLunchSalad === "OFF" ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-white text-slate-900"
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ON" className="font-bold">👀 표시함 (ON)</SelectItem>
                                            <SelectItem value="OFF" className="font-bold text-slate-400">🙈 숨김 (OFF)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Store className="h-32 w-32 text-white" />
                </div>
                <CardContent className="pt-8 pb-8">
                    <div className="flex gap-5 relative z-10">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-900/40 font-black text-xl">!</div>
                        <div className="space-y-3">
                            <p className="text-white text-lg font-bold tracking-tight">사장님을 위한 스토어 운영 가이드</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                <div className="flex gap-2 text-sm text-slate-300">
                                    <div className="mt-1 w-1.5 h-1.5 shrink-0 bg-orange-500 rounded-full" />
                                    <p>도시락/샐러드는 <strong>당일 조리</strong> 원칙에 따라 마감 시간이 중요합니다.</p>
                                </div>
                                <div className="flex gap-2 text-sm text-slate-300">
                                    <div className="mt-1 w-1.5 h-1.5 shrink-0 bg-orange-500 rounded-full" />
                                    <p>메뉴 공지 직후 주문을 받으려면 <strong>'배송 당일 오전 7시'</strong> 마감을 추천합니다.</p>
                                </div>
                                <div className="flex gap-2 text-sm text-slate-300">
                                    <div className="mt-1 w-1.5 h-1.5 shrink-0 bg-orange-500 rounded-full" />
                                    <p>운영 시간이 바뀌면 고객들에게 <strong>자동으로 안내 화면</strong>이 노출됩니다.</p>
                                </div>
                                <div className="flex gap-2 text-sm text-slate-300">
                                    <div className="mt-1 w-1.5 h-1.5 shrink-0 bg-orange-500 rounded-full" />
                                    <p>긴급한 상황에선 망설임 없이 <strong>'긴급 영업 중단'</strong>을 활용하세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
