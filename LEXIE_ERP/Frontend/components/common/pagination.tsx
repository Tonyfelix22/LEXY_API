"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page: number
  totalPages: number
  onPreviousClick: () => void
  onNextClick: () => void
}

export default function Pagination({ page, totalPages, onPreviousClick, onNextClick }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-8 p-4 rounded-xl bg-card/50 border border-border/50">
      <button
        onClick={onPreviousClick}
        disabled={page === 1}
        className="px-5 py-2.5 bg-card/80 border border-border rounded-xl text-foreground hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth flex items-center gap-2 font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">Page</span>
        <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary font-semibold text-sm">
          {page}
        </span>
        <span className="text-sm text-foreground/60">of</span>
        <span className="px-3 py-1 rounded-lg bg-card/80 border border-border text-foreground font-semibold text-sm">
          {totalPages}
        </span>
      </div>
      
      <button
        onClick={onNextClick}
        disabled={page === totalPages}
        className="px-5 py-2.5 bg-card/80 border border-border rounded-xl text-foreground hover:border-primary/50 hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all-smooth flex items-center gap-2 font-medium"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
