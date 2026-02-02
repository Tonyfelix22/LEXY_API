"use client"

import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = "" }: CardProps) {
  return <div className={`bg-white rounded-lg shadow border border-border p-6 ${className}`}>{children}</div>
}
