import { useState } from 'react'

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
        blocks: clonePlannerBlocks(
          resolveNextBlocks(clonePlannerBlocks(currentDraftBlocks)),
        ),
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
    savedBlocks: clonePlannerBlocks(savedBlocks),
    draftBlocks: clonePlannerBlocks(activeDraftBlocks),
    isDirty,
    isReady,
    addDraftBlock,
    updateDraftBlock,
    deleteDraftBlock,
    resetDraft,
  }
}
