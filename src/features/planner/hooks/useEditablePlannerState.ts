import { useState } from 'react'

import type { StudyBlock } from '../types'
import { sortPlannerBlocks } from '../utils/sort'

interface DraftBlocksOverride {
  weekStart: string
  blocks: StudyBlock[]
}

export interface EditablePlannerState {
  savedBlocks: StudyBlock[]
  draftBlocks: StudyBlock[]
  isDirty: boolean
  isReady: boolean
  addDraftBlock: (block: Omit<StudyBlock, 'id'>) => StudyBlock
  updateDraftBlock: (block: StudyBlock) => void
  deleteDraftBlock: (blockId: string) => void
  resetDraft: () => void
}

interface UseEditablePlannerStateParams {
  weekStart: string
  savedBlocks: StudyBlock[]
  isReady: boolean
}

const serializePlannerBlocks = (blocks: StudyBlock[]) =>
  JSON.stringify(
    sortPlannerBlocks(blocks).map((block) => ({
      id: block.id,
      courseId: block.courseId,
      dayOfWeek: block.dayOfWeek,
      startTime: block.startTime,
      endTime: block.endTime,
      memo: block.memo ?? '',
    })),
  )

const createDraftBlockId = () => `draft-${globalThis.crypto.randomUUID()}`

export const useEditablePlannerState = ({
  weekStart,
  savedBlocks,
  isReady,
}: UseEditablePlannerStateParams): EditablePlannerState => {
  const [draftOverride, setDraftOverride] =
    useState<DraftBlocksOverride | null>(null)
  const activeDraftBlocks =
    draftOverride?.weekStart === weekStart ? draftOverride.blocks : savedBlocks

  const replaceDraftBlocks = (
    resolveNextBlocks: (currentBlocks: StudyBlock[]) => StudyBlock[],
  ) => {
    setDraftOverride((currentOverride) => {
      const currentDraftBlocks =
        currentOverride?.weekStart === weekStart
          ? currentOverride.blocks
          : savedBlocks

      return {
        weekStart,
        blocks: resolveNextBlocks(currentDraftBlocks),
      }
    })
  }

  const addDraftBlock = (block: Omit<StudyBlock, 'id'>) => {
    const nextBlock = {
      ...block,
      id: createDraftBlockId(),
    }

    replaceDraftBlocks((currentBlocks) => [...currentBlocks, nextBlock])

    return nextBlock
  }

  const updateDraftBlock = (block: StudyBlock) => {
    replaceDraftBlocks((currentBlocks) =>
      currentBlocks.map((currentBlock) =>
        currentBlock.id === block.id ? block : currentBlock,
      ),
    )
  }

  const deleteDraftBlock = (blockId: string) => {
    replaceDraftBlocks((currentBlocks) =>
      currentBlocks.filter((block) => block.id !== blockId),
    )
  }

  const resetDraft = () => {
    setDraftOverride((currentOverride) =>
      currentOverride?.weekStart === weekStart ? null : currentOverride,
    )
  }

  const isDirty =
    serializePlannerBlocks(activeDraftBlocks) !== serializePlannerBlocks(savedBlocks)

  return {
    savedBlocks,
    draftBlocks: activeDraftBlocks,
    isDirty,
    isReady,
    addDraftBlock,
    updateDraftBlock,
    deleteDraftBlock,
    resetDraft,
  }
}
