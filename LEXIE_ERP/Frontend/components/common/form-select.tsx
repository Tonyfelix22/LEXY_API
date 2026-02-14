"use client"

import type React from "react"

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Array<{ value: string | number; label: string }>
  error?: string
}

export default function FormSelect({ label, options, error, ...props }: FormSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  )
}
