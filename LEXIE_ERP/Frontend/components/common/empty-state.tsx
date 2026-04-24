"use client"

import { Inbox, Plus } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fadeIn">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
        {icon || <Inbox className="w-10 h-10 text-primary/60" />}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      {description && <p className="text-foreground/60 mb-6 max-w-md mx-auto">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all-smooth shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift inline-flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          {action.label}
        </button>
      )}
    </div>
  )
}
