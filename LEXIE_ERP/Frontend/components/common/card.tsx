"use client"

import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "glass" | "gradient"
  hover?: boolean
}

export default function Card({ children, className = "", variant = "default", hover = false }: CardProps) {
  const baseClasses = "rounded-2xl border transition-all-smooth"
  
  const variantClasses = {
    default: "bg-card/80 border-border/50 shadow-lg",
    glass: "glass-card shadow-xl",
    gradient: "bg-gradient-to-br from-card/90 to-card/70 border-border/50 shadow-xl",
  }
  
  const hoverClasses = hover ? "hover-lift hover:border-primary/50 hover:shadow-2xl" : ""
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}
