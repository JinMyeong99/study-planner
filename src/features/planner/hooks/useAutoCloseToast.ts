import { useCallback, useEffect, useRef, useState } from 'react'

import { TOAST_AUTO_CLOSE_MS, TOAST_DISMISS_MS } from '../constants'

type ToastState =
  | {
      message: string
      type: 'success' | 'error'
    }
  | null

export const useAutoCloseToast = () => {
  const [toast, setToastState] = useState<ToastState>(null)
  const [isDismissing, setIsDismissing] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDismissTimer = useCallback(() => {
    if (!dismissTimerRef.current) return

    clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = null
  }, [])

  const setToast = useCallback(
    (nextToast: ToastState) => {
      clearDismissTimer()
      setToastState(nextToast)
      setIsDismissing(false)
    },
    [clearDismissTimer],
  )

  const dismiss = useCallback(() => {
    clearDismissTimer()
    setIsDismissing(true)

    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null
      setToastState(null)
      setIsDismissing(false)
    }, TOAST_DISMISS_MS)
  }, [clearDismissTimer])

  const clearToast = useCallback(() => setToast(null), [setToast])

  useEffect(() => {
    if (toast?.type !== 'success') return
    const timer = setTimeout(dismiss, TOAST_AUTO_CLOSE_MS)
    return () => clearTimeout(timer)
  }, [dismiss, toast])

  useEffect(() => clearDismissTimer, [clearDismissTimer])

  return { toast, isDismissing, setToast, dismiss, clearToast }
}
