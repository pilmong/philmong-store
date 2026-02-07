import { getTodayMenu } from "./actions"
import { CustomerHeader } from "./components/header"
import { MenuList } from "./components/menu-list"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { getSystemPolicy } from "../admin/settings/actions"
import { AlertTriangle, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CustomerMainPage() {
    const deadlineHour = parseInt(await getSystemPolicy("B2C_DEADLINE_HOUR", "15"))
    const deadlineBasis = await getSystemPolicy("B2C_DEADLINE_BASIS", "PREVIOUS")
    const showLunchSalad = await getSystemPolicy("B2C_SHOW_LUNCH_SALAD", "ON")
    const isPaused = (await getSystemPolicy("B2C_STORE_PAUSE", "OFF")) === "ON"
    const pauseMessage = await getSystemPolicy("B2C_STORE_PAUSE_MESSAGE", "현재 매장 사정으로 인해 잠시 주문을 중단합니다. 이용에 불편을 드려 죄송합니다.")

    const openHour = parseInt(await getSystemPolicy("B2C_OPEN_HOUR", "20"))
    const closeHour = parseInt(await getSystemPolicy("B2C_CLOSE_HOUR", "18"))

    // Schedule Logic
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }))
    const currentHour = now.getHours()

    let targetDate = new Date(now)
    let isScheduledOpen = true
    let isGap = false

    if (currentHour >= openHour) {
        // After open hour: show tomorrow's menu
        targetDate.setDate(targetDate.getDate() + 1)
        isScheduledOpen = true
    } else if (currentHour >= closeHour) {
        // Between close and open (e.g., 18:00 ~ 20:00): Gap/Maintenance
        isScheduledOpen = false
        isGap = true
    } else {
        // Before close hour: show today's menu
        targetDate = now
        isScheduledOpen = true
    }

    const { success, data: plans, isHoliday, holidayReason } = await getTodayMenu(targetDate)

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <CustomerHeader />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-indigo-900 to-slate-800 text-white py-12 px-4 shadow-lg">
                <div className="container mx-auto text-center">
                    <p className="text-indigo-200 mb-2 font-medium">건강하고 맛있는 한 끼</p>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        오늘의 식탁
                    </h1>
                    <p className="text-white/80">
                        {format(targetDate, "yyyy년 M월 d일 EEEE", { locale: ko })} 판매 메뉴
                    </p>
                </div>
            </section>

            <main className="container mx-auto px-4 -mt-6">
                <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px]">
                    {isPaused ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6">
                            <div className="bg-red-50 p-6 rounded-full">
                                <AlertTriangle className="h-16 w-16 text-red-500 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">잠시 주문을 멈춥니다</h2>
                                <p className="text-slate-500 font-medium">서비스 이용에 불편을 드려 대단히 죄송합니다.</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-md w-full">
                                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {pauseMessage}
                                </p>
                            </div>
                            <div className="pt-4 flex items-center gap-2 text-slate-400 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>상황이 해결되는 대로 다시 찾아뵙겠습니다.</span>
                            </div>
                        </div>
                    ) : isGap ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                            <div className="bg-amber-50 p-6 rounded-full">
                                <Clock className="h-16 w-16 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">메뉴 정비 시간입니다</h2>
                                <p className="text-slate-500 font-medium">내일의 맛있는 식탁을 준비하고 있습니다.</p>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-2xl border border-dashed border-slate-300 max-w-md w-full">
                                <p className="text-slate-600 font-medium">
                                    오후 <span className="text-emerald-600 font-bold">{openHour}시</span>에 내일 메뉴와 함께 오픈합니다!
                                </p>
                            </div>
                            <p className="text-sm text-slate-400">조금만 기다려 주세요. 금방 돌아옵니다!</p>
                        </div>
                    ) : isHoliday ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6">
                            <div className="bg-blue-50 p-6 rounded-full">
                                <Clock className="h-16 w-16 text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">오늘은 쉬어갑니다</h2>
                                <p className="text-slate-500 font-medium">더 좋은 모습으로 찾아뵙겠습니다.</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-sm w-full">
                                <div className="text-sm font-semibold text-slate-400 mb-1">휴무 사유</div>
                                <p className="text-slate-800 font-bold text-lg">
                                    {holidayReason}
                                </p>
                            </div>
                            <div className="pt-4 text-sm text-slate-400 font-medium">
                                ※ 정기 휴무 및 공휴일은 매장 휴무로 인해 <span className="text-red-400 font-bold underline underline-offset-4">주문 접수가 불가능</span>합니다.
                            </div>
                        </div>
                    ) : (
                        <MenuList
                            date={targetDate}
                            plans={plans || []}
                            deadlineHour={deadlineHour}
                            deadlineBasis={deadlineBasis}
                            showLunchSalad={showLunchSalad === "ON"}
                        />
                    )}
                </div>
            </main>
        </div>
    )
}
