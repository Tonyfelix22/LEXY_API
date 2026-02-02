"use client"

interface PaginationProps {
  page: number
  totalPages: number
  onPreviousClick: () => void
  onNextClick: () => void
}

export default function Pagination({ page, totalPages, onPreviousClick, onNextClick }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={onPreviousClick}
        disabled={page === 1}
        className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
      >
        Previous
      </button>
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={onNextClick}
        disabled={page === totalPages}
        className="px-4 py-2 bg-border text-foreground rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
      >
        Next
      </button>
    </div>
  )
}
