import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useUnsavedChangesWarning } from './useUnsavedChangesWarning'

const createBeforeUnloadEvent = () =>
  new Event('beforeunload', { cancelable: true })

describe('useUnsavedChangesWarning', () => {
  it('enabled가 false이면 beforeunload 기본 동작을 막지 않는다', () => {
    renderHook(() => useUnsavedChangesWarning(false))

    const event = createBeforeUnloadEvent()
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('enabled가 true이면 beforeunload 기본 동작을 막는다', () => {
    renderHook(() => useUnsavedChangesWarning(true))

    const event = createBeforeUnloadEvent()
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('enabled가 true에서 false가 되면 beforeunload 리스너를 해제한다', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useUnsavedChangesWarning(enabled),
      {
        initialProps: {
          enabled: true,
        },
      },
    )

    const dirtyEvent = createBeforeUnloadEvent()
    window.dispatchEvent(dirtyEvent)

    expect(dirtyEvent.defaultPrevented).toBe(true)

    rerender({ enabled: false })

    const cleanEvent = createBeforeUnloadEvent()
    window.dispatchEvent(cleanEvent)

    expect(cleanEvent.defaultPrevented).toBe(false)
  })
})
