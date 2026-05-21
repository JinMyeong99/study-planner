import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PlannerApiError, savePlanner } from './api'
import {
  PlannerBlockModal,
  type PlannerBlockFormValues,
} from './PlannerBlockModal'
import {
  formatDayOfWeek,
  formatLocalDate,
  getWeekDateRangeLabel,
  getWeekStartDate,
} from './utils/date'
import { findFirstTimeConflict } from './utils/conflict'
import { getNextPlannerSlotTime, parseTimeToMinutes } from './utils/time'
import {
  createSavePlannerPayload,
  formatConflictMessage,
  getConflictBlockIds,
} from './utils/save'
import { useEditablePlannerState } from './hooks/useEditablePlannerState'
import { usePlannerData } from './hooks/usePlannerData'
import { PlannerWeekGrid } from './PlannerWeekGrid'
import type { Course, StudyBlock } from './types'
import { plannerQueryKeys } from './queryKeys'
import './PlannerPage.css'

export interface PlannerPageProps {
  initialWeekStart?: string
}

type PlannerModalState =
  | {
      mode: 'create'
      initialValues: PlannerBlockFormValues
    }
  | {
      block: StudyBlock
      mode: 'edit'
      initialValues: PlannerBlockFormValues
    }

type SaveFeedback =
  | {
      message: string
      type: 'success' | 'error'
    }
  | null

const sortPlannerBlocks = (blocks: StudyBlock[]) =>
  [...blocks].sort((firstBlock, secondBlock) => {
    const firstStart = parseTimeToMinutes(firstBlock.startTime) ?? 0
    const secondStart = parseTimeToMinutes(secondBlock.startTime) ?? 0

    return (
      firstBlock.dayOfWeek - secondBlock.dayOfWeek ||
      firstStart - secondStart ||
      firstBlock.endTime.localeCompare(secondBlock.endTime)
    )
  })

const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

const getCurrentWeekStart = () => formatLocalDate(getWeekStartDate(new Date()))

const createFormValuesFromBlock = (
  block: StudyBlock,
): PlannerBlockFormValues => ({
  courseId: block.courseId,
  dayOfWeek: block.dayOfWeek,
  startTime: block.startTime,
  endTime: block.endTime,
  memo: block.memo ?? '',
})

const createFormValuesFromSlot = ({
  dayOfWeek,
  startTime,
}: {
  dayOfWeek: number
  startTime: string
}): PlannerBlockFormValues => ({
  courseId: '',
  dayOfWeek,
  startTime,
  endTime: getNextPlannerSlotTime(startTime),
  memo: '',
})

const getMemoPayload = (memo: string) => {
  const trimmedMemo = memo.trim()

  return trimmedMemo ? { memo: trimmedMemo } : {}
}

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof PlannerApiError) {
    return error.message
  }

  return '플래너 저장에 실패했습니다. 다시 시도해 주세요.'
}

const PlannerBlockList = ({
  blocks,
  conflictBlockIds = new Set<string>(),
  courses,
  onBlockSelect,
}: {
  blocks: StudyBlock[]
  conflictBlockIds?: Set<string>
  courses: Course[]
  onBlockSelect: (block: StudyBlock) => void
}) => {
  const courseMap = createCourseMap(courses)
  const sortedBlocks = sortPlannerBlocks(blocks)

  if (sortedBlocks.length === 0) {
    return (
      <div className="planner-empty-state">
        <strong>이번 주 학습 블록이 없습니다.</strong>
        <span>시간 슬롯을 클릭해 학습 블록을 추가할 수 있습니다.</span>
      </div>
    )
  }

  return (
    <ul className="planner-block-list">
      {sortedBlocks.map((block) => {
        const course = courseMap.get(block.courseId)
        const hasConflict = conflictBlockIds.has(block.id)

        return (
          <li key={block.id}>
            <button
              aria-label={`${course?.title ?? '알 수 없는 강의'} ${formatDayOfWeek(block.dayOfWeek)}요일 ${block.startTime} - ${block.endTime} 편집`}
              className={
                hasConflict
                  ? 'planner-block-card is-conflict'
                  : 'planner-block-card'
              }
              onClick={() => {
                onBlockSelect(block)
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                className="planner-block-card__color"
                style={{ backgroundColor: course?.color ?? '#8f97a8' }}
              />
              <span className="planner-block-card__content">
                <strong>{course?.title ?? '알 수 없는 강의'}</strong>
                <span>
                  {formatDayOfWeek(block.dayOfWeek)}요일 · {block.startTime} -{' '}
                  {block.endTime}
                </span>
                {hasConflict ? (
                  <em className="planner-conflict-badge">시간 충돌</em>
                ) : null}
                {block.memo ? <p>{block.memo}</p> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export const PlannerPage = ({ initialWeekStart }: PlannerPageProps) => {
  const [modalState, setModalState] = useState<PlannerModalState | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null)
  const queryClient = useQueryClient()
  const defaultWeekStart = useMemo(() => getCurrentWeekStart(), [])
  const weekStart = initialWeekStart ?? defaultWeekStart
  const plannerData = usePlannerData(weekStart)
  const isPlannerReady = !plannerData.isLoading && !plannerData.isError
  const editablePlanner = useEditablePlannerState({
    weekStart: plannerData.plannerWeekStart,
    savedBlocks: plannerData.savedBlocks,
    isReady: isPlannerReady,
  })
  const conflictPair = useMemo(
    () => findFirstTimeConflict(editablePlanner.draftBlocks),
    [editablePlanner.draftBlocks],
  )
  const conflictBlockIds = useMemo(
    () => getConflictBlockIds(conflictPair),
    [conflictPair],
  )
  const conflictMessage = conflictPair
    ? formatConflictMessage(conflictPair, plannerData.courses)
    : null
  const saveMutation = useMutation({
    mutationFn: savePlanner,
    onSuccess: (response) => {
      queryClient.setQueryData(
        plannerQueryKeys.week(response.weekStart),
        response,
      )
      editablePlanner.resetDraft()
      setSaveFeedback({
        message: '저장되었습니다.',
        type: 'success',
      })
    },
    onError: (error) => {
      setSaveFeedback({
        message: getSaveErrorMessage(error),
        type: 'error',
      })
    },
  })
  const canShowPlannerContent = isPlannerReady && editablePlanner.isReady
  const canSavePlanner =
    canShowPlannerContent && editablePlanner.isDirty && !saveMutation.isPending
  const closeModal = () => {
    setModalState(null)
  }

  const handleModalSubmit = (values: PlannerBlockFormValues) => {
    setSaveFeedback(null)

    const nextBlockValues = {
      courseId: values.courseId,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      ...getMemoPayload(values.memo),
    }

    if (modalState?.mode === 'edit') {
      editablePlanner.updateDraftBlock({
        id: modalState.block.id,
        ...nextBlockValues,
      })
    } else {
      editablePlanner.addDraftBlock(nextBlockValues)
    }

    closeModal()
  }

  const handleModalDelete = () => {
    setSaveFeedback(null)

    if (modalState?.mode !== 'edit') {
      return
    }

    editablePlanner.deleteDraftBlock(modalState.block.id)
    closeModal()
  }

  const handleSave = () => {
    if (saveMutation.isPending || !editablePlanner.isDirty) {
      return
    }

    if (conflictPair) {
      setSaveFeedback({
        message: formatConflictMessage(conflictPair, plannerData.courses),
        type: 'error',
      })
      return
    }

    saveMutation.mutate(
      createSavePlannerPayload(
        plannerData.plannerWeekStart,
        editablePlanner.draftBlocks,
      ),
    )
  }

  return (
    <main className="planner-page">
      <section className="planner-hero" aria-labelledby="planner-title">
        <div>
          <h1 id="planner-title">주간 학습 플래너</h1>
          <p>{getWeekDateRangeLabel(weekStart)}</p>
        </div>
        <div className="planner-status-panel" aria-label="플래너 상태">
          <span>
            서버 상태:{' '}
            <strong>
              {plannerData.isLoading
                ? '불러오는 중'
                : plannerData.isError
                  ? '오류'
                  : '로드 완료'}
            </strong>
          </span>
          <span>
            편집 상태:{' '}
            <strong>
              {editablePlanner.isDirty ? '저장되지 않은 변경 사항' : '변경 없음'}
            </strong>
          </span>
          <button
            className="planner-save-button"
            disabled={!canSavePlanner}
            onClick={handleSave}
            type="button"
          >
            {saveMutation.isPending ? '저장 중...' : '저장'}
          </button>
          {saveFeedback ? (
            <span
              className={`planner-save-feedback planner-save-feedback--${saveFeedback.type}`}
              role={saveFeedback.type === 'error' ? 'alert' : 'status'}
            >
              {saveFeedback.message}
            </span>
          ) : null}
        </div>
      </section>

      {plannerData.isLoading ? (
        <section className="planner-message" role="status">
          주간 플래너를 불러오는 중입니다.
        </section>
      ) : null}

      {plannerData.isError ? (
        <section className="planner-message planner-message--error" role="alert">
          <strong>플래너 정보를 불러오지 못했습니다.</strong>
          <p>{plannerData.errorMessage}</p>
          <button
            onClick={() => {
              void plannerData.refetch()
            }}
            type="button"
          >
            다시 시도
          </button>
        </section>
      ) : null}

      {canShowPlannerContent ? (
        <div className="planner-layout">
          <section className="planner-panel" aria-labelledby="planner-grid-title">
            <div className="planner-panel__header">
              <h2 id="planner-grid-title">주간 시간표</h2>
              <span>08:00 - 20:00 · 30분 단위</span>
            </div>
            {conflictMessage ? (
              <p className="planner-conflict-alert" role="alert">
                {conflictMessage}
              </p>
            ) : null}
            <PlannerWeekGrid
              blocks={editablePlanner.draftBlocks}
              conflictBlockIds={conflictBlockIds}
              courses={plannerData.courses}
              onBlockClick={(block) => {
                setModalState({
                  block,
                  mode: 'edit',
                  initialValues: createFormValuesFromBlock(block),
                })
              }}
              onSlotClick={(selection) => {
                setModalState({
                  mode: 'create',
                  initialValues: createFormValuesFromSlot(selection),
                })
              }}
            />
          </section>

          <section
            className="planner-panel"
            aria-labelledby="planner-block-list-title"
          >
            <div className="planner-panel__header">
              <h2 id="planner-block-list-title">편집 중 학습 블록</h2>
              <span>{editablePlanner.draftBlocks.length}개</span>
            </div>
            <PlannerBlockList
              blocks={editablePlanner.draftBlocks}
              conflictBlockIds={conflictBlockIds}
              courses={plannerData.courses}
              onBlockSelect={(block) => {
                setModalState({
                  block,
                  mode: 'edit',
                  initialValues: createFormValuesFromBlock(block),
                })
              }}
            />
          </section>
        </div>
      ) : null}

      {modalState ? (
        <PlannerBlockModal
          blocks={editablePlanner.draftBlocks}
          courses={plannerData.courses}
          editingBlockId={
            modalState.mode === 'edit' ? modalState.block.id : undefined
          }
          initialValues={modalState.initialValues}
          mode={modalState.mode}
          onCancel={closeModal}
          onDelete={modalState.mode === 'edit' ? handleModalDelete : undefined}
          onSubmit={handleModalSubmit}
        />
      ) : null}
    </main>
  )
}
