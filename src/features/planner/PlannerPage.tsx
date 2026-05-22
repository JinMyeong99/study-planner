import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PlannerApiError, savePlanner } from './api'
import { PlannerBlockList } from './PlannerBlockList'
import {
  PlannerBlockModal,
  type PlannerBlockFormValues,
} from './PlannerBlockModal'
import {
  addWeeksToLocalDate,
  formatLocalDate,
  getWeekDateRangeLabel,
  getWeekStartDate,
} from './utils/date'
import { findFirstTimeConflict } from './utils/conflict'
import {
  createFormValuesFromBlock,
  createFormValuesFromSlot,
  getMemoPayload,
} from './utils/form'
import {
  createSavePlannerPayload,
  formatConflictMessage,
  getConflictBlockIds,
} from './utils/save'
import { useEditablePlannerState } from './hooks/useEditablePlannerState'
import { usePlannerData } from './hooks/usePlannerData'
import { useUnsavedChangesWarning } from './hooks/useUnsavedChangesWarning'
import { PlannerSummary } from './PlannerSummary'
import { PlannerWeekGrid } from './PlannerWeekGrid'
import type { StudyBlock } from './types'
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

const WEEK_CHANGE_CONFIRM_TITLE = '저장되지 않은 변경 사항이 있습니다'
const WEEK_CHANGE_CONFIRM_DESCRIPTION =
  '다른 주로 이동하면 현재 주의 변경 사항이 사라집니다.'

const getCurrentWeekStart = () => formatLocalDate(getWeekStartDate(new Date()))

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof PlannerApiError) {
    return error.message
  }

  return '플래너 저장에 실패했습니다. 다시 시도해 주세요.'
}

export const PlannerPage = ({ initialWeekStart }: PlannerPageProps) => {
  const [modalState, setModalState] = useState<PlannerModalState | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null)
  const [isToastDismissing, setIsToastDismissing] = useState(false)
  const queryClient = useQueryClient()
  const defaultWeekStart = useMemo(() => getCurrentWeekStart(), [])
  const [weekStart, setWeekStart] = useState(
    () => initialWeekStart ?? defaultWeekStart,
  )
  const [pendingWeekStart, setPendingWeekStart] = useState<string | null>(null)
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null)
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
  const dismissToast = () => {
    setIsToastDismissing(true)
    setTimeout(() => {
      setSaveFeedback(null)
      setIsToastDismissing(false)
    }, 180)
  }
  useEffect(() => {
    if (saveFeedback?.type !== 'success') return
    const timer = setTimeout(dismissToast, 3000)
    return () => clearTimeout(timer)
  }, [saveFeedback])
  useEffect(() => {
    if (!pendingWeekStart) return

    keepEditingButtonRef.current?.focus()
  }, [pendingWeekStart])
  const canShowPlannerContent = isPlannerReady && editablePlanner.isReady
  const canSavePlanner =
    canShowPlannerContent && editablePlanner.isDirty && !saveMutation.isPending
  useUnsavedChangesWarning(canShowPlannerContent && editablePlanner.isDirty)
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

  const clearTransientPlannerUi = () => {
    setModalState(null)
    setSaveFeedback(null)
    setIsToastDismissing(false)
  }

  const moveToWeek = (nextWeekStart: string) => {
    clearTransientPlannerUi()
    setWeekStart(nextWeekStart)
  }

  const handleWeekChange = (amount: number) => {
    if (saveMutation.isPending) {
      return
    }

    const nextWeekStart = addWeeksToLocalDate(weekStart, amount)

    if (editablePlanner.isDirty) {
      setPendingWeekStart(nextWeekStart)
      return
    }

    moveToWeek(nextWeekStart)
  }

  const cancelWeekChange = () => {
    setPendingWeekStart(null)
  }

  const confirmWeekChange = () => {
    if (!pendingWeekStart) {
      return
    }

    const nextWeekStart = pendingWeekStart

    editablePlanner.resetDraft()
    setPendingWeekStart(null)
    moveToWeek(nextWeekStart)
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
            <div className="planner-panel__header planner-panel__header--with-navigation">
              <div className="planner-panel__title">
                <h2 id="planner-grid-title">주간 학습 플래너</h2>
                <span>{getWeekDateRangeLabel(weekStart)}</span>
              </div>
              <div className="planner-week-navigation" aria-label="주간 이동">
                <button
                  aria-label="이전 주로 이동"
                  disabled={saveMutation.isPending}
                  onClick={() => handleWeekChange(-1)}
                  type="button"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                <button
                  aria-label="다음 주로 이동"
                  disabled={saveMutation.isPending}
                  onClick={() => handleWeekChange(1)}
                  type="button"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </div>
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
              weekStart={weekStart}
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
            <div className="planner-grid-footer">
              {editablePlanner.isDirty ? (
                <span className="planner-dirty-indicator">저장되지 않은 변경 사항</span>
              ) : null}
              <button
                className="planner-save-button"
                disabled={!canSavePlanner}
                onClick={handleSave}
                type="button"
              >
                {saveMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </section>

          <div className="planner-side">
            <PlannerSummary
              blocks={editablePlanner.draftBlocks}
              courses={plannerData.courses}
            />
            <section
              className="planner-panel"
              aria-labelledby="planner-block-list-title"
            >
              <div className="planner-panel__header">
                <h2 id="planner-block-list-title">이번 주 강의 리스트</h2>
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
        </div>
      ) : null}

      {saveFeedback ? (
        <div
          className={`planner-toast planner-toast--${saveFeedback.type}${isToastDismissing ? ' is-dismissing' : ''}`}
          role={saveFeedback.type === 'error' ? 'alert' : 'status'}
        >
          <em aria-hidden="true" className="planner-toast__icon">
            {saveFeedback.type === 'success' ? '✓' : '!'}
          </em>
          <span className="planner-toast__message">{saveFeedback.message}</span>
          <button
            aria-label="닫기"
            className="planner-toast__close"
            onClick={dismissToast}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}

      {pendingWeekStart ? (
        <div
          className="planner-week-change-confirm-backdrop"
          onClick={cancelWeekChange}
        >
          <div
            className="planner-week-change-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="week-change-confirm-title"
            aria-describedby="week-change-confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            <strong id="week-change-confirm-title">
              {WEEK_CHANGE_CONFIRM_TITLE}
            </strong>
            <p id="week-change-confirm-description">
              {WEEK_CHANGE_CONFIRM_DESCRIPTION}
            </p>
            <div className="planner-week-change-confirm__actions">
              <button
                ref={keepEditingButtonRef}
                className="planner-modal__secondary-button"
                onClick={cancelWeekChange}
                type="button"
              >
                계속 편집
              </button>
              <button
                className="planner-modal__danger-button"
                onClick={confirmWeekChange}
                type="button"
              >
                변경 버리고 이동
              </button>
            </div>
          </div>
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
