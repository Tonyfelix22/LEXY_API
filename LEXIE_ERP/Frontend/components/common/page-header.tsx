"use client"

import { ArrowRight, Plus } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: "plus" | "arrow-right"
  }
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gradient">{title}</h1>
        {description && <p className="text-foreground/60 mt-2">{description}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all-smooth shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift flex items-center gap-2 font-medium"
        >
          {action.icon === "plus" ? (
            <Plus className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
          {action.label}
        </button>
      )}
    </div>
  )
}
