import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { StudyBlock } from '../types'
import { useEditablePlannerState } from './useEditablePlannerState'

const savedBlock: StudyBlock = {
  id: 'block-1',
  courseId: 'course-react',
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '10:00',
}

const draftBlock: StudyBlock = {
  id: 'block-draft',
  courseId: 'course-typescript',
  dayOfWeek: 1,
  startTime: '10:00',
  endTime: '11:00',
}

const serverBlock: StudyBlock = {
  id: 'block-server',
  courseId: 'course-algorithm',
  dayOfWeek: 2,
  startTime: '14:00',
  endTime: '15:00',
}

describe('useEditablePlannerState', () => {
  it('서버 blocks가 준비되면 draft를 같은 값으로 초기화한다', async () => {
    const { result } = renderHook(
      ({ savedBlocks }) =>
        useEditablePlannerState({
          weekStart: '2026-05-18',
          savedBlocks,
          isReady: true,
        }),
      {
        initialProps: {
          savedBlocks: [savedBlock],
        },
      },
    )

    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(result.current.savedBlocks).toEqual([savedBlock])
    expect(result.current.draftBlocks).toEqual([savedBlock])
    expect(result.current.isDirty).toBe(false)
  })

  it('draft가 서버 blocks와 달라지면 dirty 상태가 된다', async () => {
    const { result } = renderHook(
      ({ savedBlocks }) =>
        useEditablePlannerState({
          weekStart: '2026-05-18',
          savedBlocks,
          isReady: true,
        }),
      {
        initialProps: {
          savedBlocks: [savedBlock],
        },
      },
    )

    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => {
      result.current.setDraftBlocks([...result.current.draftBlocks, draftBlock])
    })

    expect(result.current.isDirty).toBe(true)
    expect(result.current.draftBlocks).toEqual([savedBlock, draftBlock])
  })

  it('resetDraft를 호출하면 서버 기준 상태로 돌아간다', async () => {
    const { result } = renderHook(
      ({ savedBlocks }) =>
        useEditablePlannerState({
          weekStart: '2026-05-18',
          savedBlocks,
          isReady: true,
        }),
      {
        initialProps: {
          savedBlocks: [savedBlock],
        },
      },
    )

    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => {
      result.current.setDraftBlocks([draftBlock])
    })
    act(() => {
      result.current.resetDraft()
    })

    expect(result.current.draftBlocks).toEqual([savedBlock])
    expect(result.current.isDirty).toBe(false)
  })

  it('같은 주차에서 dirty 상태이면 refetch된 서버 blocks가 draft를 덮어쓰지 않는다', async () => {
    const { result, rerender } = renderHook(
      ({ savedBlocks }) =>
        useEditablePlannerState({
          weekStart: '2026-05-18',
          savedBlocks,
          isReady: true,
        }),
      {
        initialProps: {
          savedBlocks: [savedBlock],
        },
      },
    )

    await waitFor(() => expect(result.current.isReady).toBe(true))

    act(() => {
      result.current.setDraftBlocks([...result.current.draftBlocks, draftBlock])
    })

    rerender({
      savedBlocks: [savedBlock, serverBlock],
    })

    await waitFor(() =>
      expect(result.current.savedBlocks).toEqual([savedBlock, serverBlock]),
    )

    expect(result.current.draftBlocks).toEqual([savedBlock, draftBlock])
    expect(result.current.isDirty).toBe(true)
  })
})
