import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ShoppingCart,
    Users,
    Building2,
    Truck,
    ArrowRight,
    Zap,
    TrendingUp,
    ShieldCheck,
    Ticket,
    Settings2,
    PackageSearch,
    Store
} from "lucide-react";

export default async function AdminDashboardPage() {
    // 🛍️ 장사꾼을 위한 실시간 데이터 요약 (이제 DB 싱크가 완료되어 직접 조회 가능)
    const [orderCount, clientCount, userCount, activeZones] = await Promise.all([
        prisma.order.count(),
        prisma.client.count(),
        prisma.user.count(),
        prisma.deliveryZone.count({ where: { isActive: true } })
    ]);

    // 🎯 장사꾼의 핵심 도구함
    const tools = [
        {
            href: "/admin/orders",
            label: "통합 주문 관리",
            description: "온라인/수기 주문 통합 처리 및 OMS",
            icon: ShoppingCart,
            color: "emerald",
            tags: ["주문접수", "매출분석"]
        },
        {
            href: "/admin/clients",
            label: "B2B 고객사 관리",
            description: "기업 전용 단가 및 정기 납품 계약 관리",
            icon: Building2,
            color: "amber",
            tags: ["거래처", "특수단가"]
        },
        {
            href: "/admin/users",
            label: "B2C 회원 관리",
            description: "회원 등급, 포인트 및 활동 이력 관리",
            icon: Users,
            color: "indigo",
            tags: ["CRM", "적립금"]
        },
        {
            href: "/admin/delivery-zones",
            label: "배송 제어 센터",
            description: "구역별 배달비 설정 및 라이더 물류 관리",
            icon: Truck,
            color: "sky",
            tags: ["TMS", "배달구역"]
        }
    ];

    // 📢 추가 리소스 (하단 카드)
    const secondaryTools = [
        { href: "/admin/coupons", label: "프로모션/쿠폰", icon: Ticket },
        { href: "/admin/products", label: "매칭 상품 설정", icon: PackageSearch },
        { href: "/admin/settings", label: "스토어 운영 정책", icon: Settings2 },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-200 overflow-hidden relative rounded-3xl border border-white/5">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-emerald-500/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-amber-500/10 blur-[100px] rounded-full" />
            </div>

            <main className="relative z-10 p-8 md:p-12">
                {/* Header Section */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black mb-4 uppercase tracking-widest">
                            <Zap className="w-3 h-3" />
                            <span>Sales Operational: Commander Mode</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-3 flex items-center gap-3">
                            PHILMONG <Store className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400 animate-gradient-x">SALES PORTAL</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            필몽 스토어 판매 총괄 지휘 센터입니다. <br className="hidden md:block" />
                            모든 주문과 고객, 배송 데이터가 이곳에 집결됩니다.
                        </p>
                    </div>

                    {/* Sales Metrics Overlay */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-right-4 duration-700">
                        <MetricCard label="Orders" value={orderCount} color="text-emerald-400" />
                        <MetricCard label="B2B Clients" value={clientCount} color="text-amber-400" />
                        <MetricCard label="B2C Users" value={userCount} color="text-indigo-400" />
                        <MetricCard label="Active Zones" value={activeZones} color="text-sky-400" />
                    </div>
                </header>

                {/* Main Command Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((item, idx) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative overflow-hidden bg-white/5 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <item.icon className="absolute -bottom-4 -right-4 w-28 h-28 text-white/[0.03] rotate-12 group-hover:scale-125 transition-transform duration-700" />

                            <div className="flex justify-between items-start mb-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-2xl
                                    ${item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' : ''}
                                    ${item.color === 'amber' ? 'bg-amber-500/10 text-amber-400 shadow-amber-500/20 group-hover:bg-amber-500 group-hover:text-white' : ''}
                                    ${item.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 shadow-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white' : ''}
                                    ${item.color === 'sky' ? 'bg-sky-500/10 text-sky-400 shadow-sky-500/20 group-hover:bg-sky-500 group-hover:text-white' : ''}
                                `}>
                                    <item.icon className="w-7 h-7" />
                                </div>
                                <div className="p-2 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                    <ArrowRight className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight transition-colors">
                                {item.label}
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                                {item.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-500 font-bold uppercase tracking-widest group-hover:text-white/60 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Secondary Access Hub */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {secondaryTools.map((tool) => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl transition-all group"
                        >
                            <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-white transition-colors">
                                <tool.icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-300 group-hover:text-white">{tool.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Footer Section */}
                <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
                    <div className="flex items-center gap-3 text-sm text-slate-400 font-black tracking-widest uppercase">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span>Revenue & Logistics Sync Terminal</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Store Node Operational</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

function MetricCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[140px] shadow-inner">
            <div className="text-[10px] text-slate-500 font-black uppercase mb-2 tracking-widest">{label}</div>
            <div className={`text-3xl font-black ${color} tabular-nums`}>{value.toLocaleString()}</div>
        </div>
    );
}
