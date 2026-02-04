import { getClients } from "./actions"
import { ClientDialog } from "./client-dialog"
import { ClientsTable } from "./clients-table"

export default async function ClientsPage() {
    const { success, data: clients } = await getClients()

    if (!success || !clients) {
        return <div>Failed to load clients</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">B2B 기업 런치 관리</h1>
                    <p className="text-muted-foreground">고객사를 등록하고 주간 도시락 수량을 관리합니다.</p>
                </div>
                <ClientDialog />
            </div>

            <ClientsTable clients={clients} />
        </div>
    )
}
