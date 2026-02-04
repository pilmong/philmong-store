import { MenuCalendar } from "./menu-calendar"

export default function MenuPlanningPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">식단 편성 (Menu Planning)</h1>
            <p className="text-muted-foreground mb-6">
                날짜를 선택하고 그날 판매할 데일리 메뉴나 상시 메뉴를 구성하세요.
            </p>

            <MenuCalendar />
        </div>
    )
}
