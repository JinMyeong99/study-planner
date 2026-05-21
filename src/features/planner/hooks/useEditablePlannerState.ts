import { useEffect, useRef, useState } from 'react'
import type { SetStateAction } from 'react'

import type { StudyBlock } from '../types'

interface EditablePlannerStateSnapshot {
  weekStart: string | null
  savedBlocks: StudyBlock[]
  draftBlocks: StudyBlock[]
}

export interface EditablePlannerState {
  savedBlocks: StudyBlock[]
  draftBlocks: StudyBlock[]
  isDirty: boolean
  isReady: boolean
  setDraftBlocks: (nextBlocks: SetStateAction<StudyBlock[]>) => void
  resetDraft: () => void
}

interface UseEditablePlannerStateParams {
  weekStart: string
  savedBlocks: StudyBlock[]
  isReady: boolean
}

const clonePlannerBlocks = (blocks: StudyBlock[]) =>
  blocks.map((block) => ({ ...block }))

const serializePlannerBlocks = (blocks: StudyBlock[]) =>
  JSON.stringify(
    blocks
      .map((block) => ({
        id: block.id,
        courseId: block.courseId,
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        memo: block.memo ?? '',
      }))
      .sort((firstBlock, secondBlock) =>
        [
          firstBlock.dayOfWeek - secondBlock.dayOfWeek,
          firstBlock.startTime.localeCompare(secondBlock.startTime),
          firstBlock.endTime.localeCompare(secondBlock.endTime),
          firstBlock.courseId.localeCompare(secondBlock.courseId),
          firstBlock.id.localeCompare(secondBlock.id),
        ].find((result) => result !== 0) ?? 0,
      ),
  )

const createInitialState = (): EditablePlannerStateSnapshot => ({
  weekStart: null,
  savedBlocks: [],
  draftBlocks: [],
})

export const useEditablePlannerState = ({
  weekStart,
  savedBlocks,
  isReady,
}: UseEditablePlannerStateParams): EditablePlannerState => {
  const [state, setState] =
    useState<EditablePlannerStateSnapshot>(createInitialState)
  const savedBlocksRef = useRef(savedBlocks)
  const savedBlocksKey = serializePlannerBlocks(savedBlocks)

  savedBlocksRef.current = savedBlocks

  useEffect(() => {
    if (!isReady) {
      return
    }

    setState((currentState) => {
      const nextSavedBlocks = clonePlannerBlocks(savedBlocksRef.current)
      const isWeekChanged = currentState.weekStart !== weekStart
      const isCurrentDirty =
        serializePlannerBlocks(currentState.draftBlocks) !==
        serializePlannerBlocks(currentState.savedBlocks)

      if (isWeekChanged || !isCurrentDirty) {
        return {
          weekStart,
          savedBlocks: nextSavedBlocks,
          draftBlocks: clonePlannerBlocks(nextSavedBlocks),
        }
      }

      return {
        ...currentState,
        savedBlocks: nextSavedBlocks,
      }
    })
  }, [isReady, savedBlocksKey, weekStart])

  const setDraftBlocks = (nextBlocks: SetStateAction<StudyBlock[]>) => {
    setState((currentState) => {
      const resolvedBlocks =
        typeof nextBlocks === 'function'
          ? nextBlocks(currentState.draftBlocks)
          : nextBlocks

      return {
        ...currentState,
        draftBlocks: clonePlannerBlocks(resolvedBlocks),
      }
    })
  }

  const resetDraft = () => {
    setState((currentState) => ({
      ...currentState,
      draftBlocks: clonePlannerBlocks(currentState.savedBlocks),
    }))
  }

  const isDirty =
    serializePlannerBlocks(state.draftBlocks) !==
    serializePlannerBlocks(state.savedBlocks)

  return {
    savedBlocks: state.savedBlocks,
    draftBlocks: state.draftBlocks,
    isDirty,
    isReady: isReady && state.weekStart === weekStart,
    setDraftBlocks,
    resetDraft,
  }
}
