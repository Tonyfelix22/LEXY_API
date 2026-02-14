"use client"

interface ModalHeaderProps {
  title: string
  onClose: () => void
}

export default function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <button onClick={onClose} className="text-muted hover:text-foreground transition">
        ✕
      </button>
    </div>
  )
}
