"use client"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
}

export default function LoadingSpinner({ size = "md", fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-12 w-12 border-4",
    lg: "h-16 w-16 border-4",
  }
  
  const spinner = (
    <div className="relative">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-primary/30 border-t-primary`}></div>
      <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {spinner}
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center">
      {spinner}
    </div>
  )
}
