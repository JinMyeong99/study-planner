import { useMemo, useState, type FormEvent } from 'react'

import './PlannerBlockModal.css'

import { ConfirmDialog } from './ConfirmDialog'
import type { Course, PlannerBlockFormValues, StudyBlock } from './types'
import { createCourseMap } from './utils/blocks'
import {
  createCourseOptions,
  endTimeSelectOptions,
  startTimeSelectOptions,
  weekdayOptions,
} from './utils/options'
import { MAX_MEMO_LENGTH, getValidationMessage } from './utils/validation'
import { PlannerSelect } from './PlannerSelect'

export type { PlannerBlockFormValues }

interface PlannerBlockModalProps {
  blocks: StudyBlock[]
  courses: Course[]
  editingBlockId?: string
  initialValues: PlannerBlockFormValues
  mode: 'create' | 'edit'
  onCancel: () => void
  onDelete?: () => void
  onSubmit: (values: PlannerBlockFormValues) => void
}

export const PlannerBlockModal = ({
  blocks,
  courses,
  editingBlockId,
  initialValues,
  mode,
  onCancel,
  onDelete,
  onSubmit,
}: PlannerBlockModalProps) => {
  const [values, setValues] = useState(initialValues)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const courseMap = useMemo(() => createCourseMap(courses), [courses])
  const deleteConfirmMessage = `'${courseMap.get(values.courseId)?.title ?? '이 강의'}'를 삭제할까요?`
  const courseOptions = createCourseOptions(courses)
  const memoLength = values.memo.length

  const updateValue = <Key extends keyof PlannerBlockFormValues>(
    key: Key,
    value: PlannerBlockFormValues[Key],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }))
    setErrorMessage(null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationMessage = getValidationMessage({
      blocks,
      courses,
      editingBlockId,
      values,
    })

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    onSubmit(values)
  }

  return (
    <div className="planner-modal-backdrop">
      <section
        aria-label={mode === 'create' ? '학습 블록 추가' : '학습 블록 편집'}
        aria-modal="true"
        className="planner-modal"
        role="dialog"
      >
        <form onSubmit={handleSubmit}>
          <div className="planner-modal__header">
            <button
              aria-label="모달 닫기"
              className="planner-modal__close"
              onClick={onCancel}
              type="button"
            >
              ×
            </button>
          </div>

          <div className="planner-modal__fields">
            <PlannerSelect
              label="강의"
              onChange={(nextValue) => {
                updateValue('courseId', nextValue)
              }}
              options={courseOptions}
              value={values.courseId}
            />

            <PlannerSelect
              label="요일"
              onChange={(nextValue) => {
                updateValue('dayOfWeek', Number(nextValue))
              }}
              options={weekdayOptions}
              value={String(values.dayOfWeek)}
            />

            <div className="planner-modal__time-fields">
              <PlannerSelect
                label="시작 시간"
                onChange={(nextValue) => {
                  updateValue('startTime', nextValue)
                }}
                options={startTimeSelectOptions}
                value={values.startTime}
              />

              <PlannerSelect
                label="종료 시간"
                onChange={(nextValue) => {
                  updateValue('endTime', nextValue)
                }}
                options={endTimeSelectOptions}
                value={values.endTime}
              />
            </div>

            <label>
              <span>메모</span>
              <textarea
                onChange={(event) => {
                  updateValue('memo', event.target.value)
                }}
                placeholder="학습 목표나 메모를 남겨보세요."
                rows={4}
                value={values.memo}
              />
            </label>
            <span
              className={
                memoLength > MAX_MEMO_LENGTH
                  ? 'planner-modal__memo-count is-over'
                  : 'planner-modal__memo-count'
              }
            >
              {memoLength}/{MAX_MEMO_LENGTH}
            </span>
          </div>

          {errorMessage ? (
            <p className="planner-modal__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="planner-modal__actions">
            {onDelete ? (
              <div className="planner-modal__delete">
                <button
                  className="planner-modal__danger-button"
                  onClick={() => setIsConfirmingDelete(true)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            ) : null}

            <div className="planner-modal__submit-actions">
              <button
                className="planner-modal__secondary-button"
                onClick={onCancel}
                type="button"
              >
                취소
              </button>
              <button className="planner-modal__primary-button" type="submit">
                확인
              </button>
            </div>
          </div>
        </form>
      </section>

      {isConfirmingDelete ? (
        <ConfirmDialog
          cancelLabel="취소"
          confirmLabel="삭제"
          title={deleteConfirmMessage}
          onCancel={() => setIsConfirmingDelete(false)}
          onConfirm={onDelete!}
        />
      ) : null}
    </div>
  )
}
