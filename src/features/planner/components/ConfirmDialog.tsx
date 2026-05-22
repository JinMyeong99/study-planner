import { useEffect, useId, useRef } from 'react'

import './ConfirmDialog.css'

interface ConfirmDialogProps {
  cancelLabel: string
  confirmLabel: string
  description?: string
  title: string
  onCancel: () => void
  onConfirm: () => void
}

export const ConfirmDialog = ({
  cancelLabel,
  confirmLabel,
  description,
  title,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  return (
    <div className="confirm-dialog-backdrop" onClick={onCancel}>
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="alertdialog"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="confirm-dialog__title" id={titleId}>
          {title}
        </p>
        {description ? (
          <p className="confirm-dialog__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            className="planner-modal__secondary-button"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="planner-modal__danger-button"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
