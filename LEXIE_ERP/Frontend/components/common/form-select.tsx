"use client"

import type React from "react"
import { AlertCircle, ChevronDown } from "lucide-react"

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Array<{ value: string | number; label: string }>
  error?: string
  placeholder?: string
}

export default function FormSelect({ label, options, error, placeholder, className = "", ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground/80">{label}</label>
      <div className="relative group">
        <select
          {...props}
          className={`w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all-smooth hover:border-primary/50 appearance-none cursor-pointer ${className}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-foreground/40">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
