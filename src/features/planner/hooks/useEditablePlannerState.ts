import { useState } from 'react'
import type { SetStateAction } from 'react'

import type { StudyBlock } from '../types'

interface DraftBlocksOverride {
  weekStart: string
  blocks: StudyBlock[]
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

export const useEditablePlannerState = ({
  weekStart,
  savedBlocks,
  isReady,
}: UseEditablePlannerStateParams): EditablePlannerState => {
  const [draftOverride, setDraftOverride] =
    useState<DraftBlocksOverride | null>(null)
  const activeDraftBlocks =
    draftOverride?.weekStart === weekStart ? draftOverride.blocks : savedBlocks

  const setDraftBlocks = (nextBlocks: SetStateAction<StudyBlock[]>) => {
    setDraftOverride((currentOverride) => {
      const currentDraftBlocks =
        currentOverride?.weekStart === weekStart
          ? currentOverride.blocks
          : savedBlocks
      const resolvedBlocks =
        typeof nextBlocks === 'function'
          ? nextBlocks(clonePlannerBlocks(currentDraftBlocks))
          : nextBlocks

      return {
        weekStart,
        blocks: clonePlannerBlocks(resolvedBlocks),
      }
    })
  }

  const resetDraft = () => {
    setDraftOverride((currentOverride) =>
      currentOverride?.weekStart === weekStart ? null : currentOverride,
    )
  }

  const isDirty =
    serializePlannerBlocks(activeDraftBlocks) !== serializePlannerBlocks(savedBlocks)

  return {
    savedBlocks: clonePlannerBlocks(savedBlocks),
    draftBlocks: clonePlannerBlocks(activeDraftBlocks),
    isDirty,
    isReady,
    setDraftBlocks,
    resetDraft,
  }
}
