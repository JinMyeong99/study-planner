import { useEffect, useRef, useState } from 'react'

import { addWeeksToLocalDate } from '../utils/date'

interface UseWeekNavigationParams {
  weekStart: string
  isDirty: boolean
  isPending: boolean
  onResetDraft: () => void
  onMoveToWeek: (nextWeekStart: string) => void
}

export const useWeekNavigation = ({
  weekStart,
  isDirty,
  isPending,
  onResetDraft,
  onMoveToWeek,
}: UseWeekNavigationParams) => {
  const [pendingWeekStart, setPendingWeekStart] = useState<string | null>(null)
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!pendingWeekStart) return
    keepEditingButtonRef.current?.focus()
  }, [pendingWeekStart])

  const handleWeekChange = (amount: number) => {
    if (isPending) return

    const nextWeekStart = addWeeksToLocalDate(weekStart, amount)

    if (isDirty) {
      setPendingWeekStart(nextWeekStart)
      return
    }

    onMoveToWeek(nextWeekStart)
  }

  const cancelWeekChange = () => {
    setPendingWeekStart(null)
  }

  const confirmWeekChange = () => {
    if (!pendingWeekStart) return

    const nextWeekStart = pendingWeekStart

    onResetDraft()
    setPendingWeekStart(null)
    onMoveToWeek(nextWeekStart)
  }

  return {
    pendingWeekStart,
    keepEditingButtonRef,
    handleWeekChange,
    cancelWeekChange,
    confirmWeekChange,
  }
}
