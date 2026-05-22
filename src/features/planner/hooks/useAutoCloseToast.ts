import { useEffect, useState } from 'react'

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
    }, 180)
  }

  const clearToast = () => {
    setToast(null)
    setIsDismissing(false)
  }

  useEffect(() => {
    if (toast?.type !== 'success') return
    const timer = setTimeout(dismiss, 3000)
    return () => clearTimeout(timer)
  }, [toast])

  return { toast, isDismissing, setToast, dismiss, clearToast }
}
