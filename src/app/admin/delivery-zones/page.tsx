import { getDeliveryZones } from "./actions"
import { DeliveryZoneDialog } from "./delivery-zone-dialog"
import { DeliveryZoneList } from "./delivery-zone-list"

export default async function DeliveryZonesPage() {
    const { success, data: zones } = await getDeliveryZones()

    if (!success || !zones) {
        return <div>Failed to load zones</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">배달 구역 관리</h1>
                    <p className="text-muted-foreground">법정동/행정동 단위로 배달비를 설정합니다.</p>
                </div>
                <DeliveryZoneDialog />
            </div>

            <DeliveryZoneList zones={zones} />
        </div>
    )
}
