"use client"

interface StatusBadgeProps {
  status: string
  variant?: "success" | "warning" | "error" | "info" | "primary"
}

export default function StatusBadge({ status, variant = "info" }: StatusBadgeProps) {
  const variantClasses = {
    success: "bg-green-500/20 text-green-300 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    error: "bg-red-500/20 text-red-300 border-red-500/30",
    info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    primary: "bg-primary/20 text-primary border-primary/30",
  }

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${variantClasses[variant]} inline-flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === "success" ? "bg-green-400" :
        variant === "warning" ? "bg-yellow-400" :
        variant === "error" ? "bg-red-400" :
        variant === "primary" ? "bg-primary" :
        "bg-blue-400"
      } animate-pulse`}></span>
      {status}
    </span>
  )
}
