"use client"

interface ActionButtonsProps {
  onCancel: () => void
  onSubmit: () => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

export default function ActionButtons({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        disabled={isLoading}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        onClick={onSubmit}
        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : submitLabel}
      </button>
    </div>
  )
}
