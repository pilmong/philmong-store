import { AdminHeader } from "./components/admin-header"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <AdminHeader />
            <main className="flex-1 container mx-auto py-6">
                {children}
            </main>
        </div>
    )
}
