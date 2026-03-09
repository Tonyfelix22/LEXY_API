"use client"

interface AuditLog {
    id: number
    timestamp: string
    user: string
    action: string
    model: string
    object_id: number
    changes: string
}

interface AuditLogTableProps {
    logs?: AuditLog[] | any // Allow undefined or unknown shapes from API
}

export default function AuditLogTable({ logs }: AuditLogTableProps) {
    // ✅ Safety layer: normalize logs to always be an array
    const safeLogs: AuditLog[] = Array.isArray(logs)
        ? logs
        : Array.isArray(logs?.logs)
            ? logs.logs
            : []

    console.log("🧩 Logs data:", logs)
    console.log("🧩 Safe logs (normalized):", safeLogs)

    const getActionColor = (action: string) => {
        switch ((action || "").toLowerCase()) {
            case "create":
                return "bg-green-500/10 text-green-500"
            case "update":
                return "bg-blue-500/10 text-blue-500"
            case "delete":
                return "bg-red-500/10 text-red-500"
            default:
                return "bg-gray-500/10 text-gray-500"
        }
    }

    // ✅ Graceful empty state
    if (safeLogs.length === 0) {
        return (
            <div className="bg-card rounded-lg shadow border border-border overflow-hidden text-center py-8 text-muted-foreground">
                No audit logs found
            </div>
        )
    }

    return (
        <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Timestamp</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Model</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Object ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Changes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {safeLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">{log.user}</td>
                            <td className="px-6 py-4 text-sm">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(
                                        log.action
                                    )}`}
                                >
                                    {log.action || "Unknown"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-foreground">{log.model}</td>
                            <td className="px-6 py-4 text-sm text-foreground">{log.object_id}</td>
                            <td
                                className="px-6 py-4 text-sm text-foreground max-w-xs truncate"
                                title={log.changes}
                            >
                                {log.changes}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
