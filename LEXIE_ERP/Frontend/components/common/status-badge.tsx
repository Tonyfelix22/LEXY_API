"use client"

interface StatusBadgeProps {
  status: string
  variant?: "success" | "warning" | "error" | "info"
}

export default function StatusBadge({ status, variant = "info" }: StatusBadgeProps) {
  const variantClasses = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  }

  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${variantClasses[variant]}`}>{status}</span>
}
