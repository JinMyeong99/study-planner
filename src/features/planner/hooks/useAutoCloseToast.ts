import { useEffect, useState } from 'react'

import { TOAST_AUTO_CLOSE_MS, TOAST_DISMISS_MS } from '../constants'

type ToastState =
  | {
      message: string
      type: 'success' | 'error'
    }
  | null

export const useAutoCloseToast = () => {
  const [toast, setToast] = useState<ToastState>(null)
  const [isDismissing, setIsDismissing] = useState(false)

  const dismiss = () => {
    setIsDismissing(true)
    setTimeout(() => {
      setToast(null)
      setIsDismissing(false)
    }, TOAST_DISMISS_MS)
  }

  const clearToast = () => {
    setToast(null)
    setIsDismissing(false)
  }

  useEffect(() => {
    if (toast?.type !== 'success') return
    const timer = setTimeout(dismiss, TOAST_AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [toast])

  return { toast, isDismissing, setToast, dismiss, clearToast }
}
