import { getTodayMenu } from "./actions"
import { CustomerHeader } from "./components/header"
import { MenuList } from "./components/menu-list"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default async function CustomerMainPage() {
    const { success, data: plans } = await getTodayMenu()
    const today = new Date()

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
                        {format(today, "yyyy년 M월 d일 EEEE", { locale: ko })}
                    </p>
                </div>
            </section>

            <main className="container mx-auto px-4 -mt-6">
                <div className="bg-white rounded-xl shadow-sm border p-6 min-h-[400px]">
                    <MenuList date={today} plans={plans || []} />
                </div>
            </main>
        </div>
    )
}
