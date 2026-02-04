import { getClient } from "../../actions"
import { WeeklyOrderManager } from "./weekly-order-manager"
import { notFound } from "next/navigation"

interface PageProps {
    params: { id: string }
}

export default async function ClientOrdersPage({ params }: PageProps) {
    // Await params in Next.js 15+ (if updated) but 14 is sync usually, 
    // however user is on 16.1.6 which treats params as Promise in some contexts?
    // Let's assume standard behavior. Next.js 15 made params async.
    // If build fails, we await it.

    // Safety check for next 15+ async params
    const { id } = await Promise.resolve(params)

    const { success, data: client } = await getClient(id)

    if (!success || !client) {
        return notFound()
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-2">{client.name} 주간 주문 관리</h1>
            <p className="text-muted-foreground mb-8">
                {client.manager} 담당자 / {client.address}
            </p>

            {client.note && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-md mb-8">
                    <h3 className="font-bold text-sm mb-1">📢 고정 요청사항</h3>
                    <p className="text-sm whitespace-pre-wrap">{client.note}</p>
                </div>
            )}

            <WeeklyOrderManager clientId={client.id} />
        </div>
    )
}
