import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

import type { Course, StudyBlock } from './types'
import { areBlocksOverlapping } from './utils/conflict'
import { formatDayOfWeek, PLANNER_WEEKDAY_LABELS } from './utils/date'
import {
  formatMinutesToTime,
  isValidPlannerTimeRange,
  plannerEndMinutes,
  plannerStartMinutes,
  PLANNER_SLOT_MINUTES,
} from './utils/time'

export interface PlannerBlockFormValues {
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  memo: string
}

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

interface PlannerSelectOption {
  color?: string
  label: string
  value: string
}

interface PlannerSelectProps {
  label: string
  onChange: (value: string) => void
  options: PlannerSelectOption[]
  value: string
}

const MAX_MEMO_LENGTH = 200

const createPlannerTimeOptions = () => {
  const options: string[] = []

  for (
    let minutes = plannerStartMinutes;
    minutes <= plannerEndMinutes;
    minutes += PLANNER_SLOT_MINUTES
  ) {
    options.push(formatMinutesToTime(minutes))
  }

  return options
}

const timeOptions = createPlannerTimeOptions()
const startTimeOptions = timeOptions.slice(0, -1)
const endTimeOptions = timeOptions.slice(1)

const createCourseMap = (courses: Course[]) =>
  new Map(courses.map((course) => [course.id, course]))

const getSelectedOptionIndex = (
  options: PlannerSelectOption[],
  value: string,
) => {
  const selectedIndex = options.findIndex((option) => option.value === value)

  return selectedIndex >= 0 ? selectedIndex : 0
}

const PlannerSelect = ({
  label,
  onChange,
  options,
  value,
}: PlannerSelectProps) => {
  const labelId = useId()
  const listboxId = useId()
  const valueId = useId()
  const selectRef = useRef<HTMLDivElement>(null)
  const selectedIndex = getSelectedOptionIndex(options, value)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selectedOption = options[selectedIndex]
  const activeOptionId = `${listboxId}-option-${activeIndex}`

  useEffect(() => {
    if (!isOpen) return
    document
      .getElementById(`${listboxId}-option-${selectedIndex}`)
      ?.scrollIntoView?.({ block: 'start' })
  }, [isOpen, listboxId, selectedIndex])

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [isOpen])

  const openListbox = () => {
    setActiveIndex(selectedIndex)
    setIsOpen(true)
  }

  const selectOption = (option: PlannerSelectOption) => {
    onChange(option.value)
    setIsOpen(false)
  }

  const moveActiveOption = (amount: number) => {
    setActiveIndex((currentIndex) =>
      (currentIndex + amount + options.length) % options.length,
    )
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()

      if (!isOpen) {
        openListbox()
        return
      }

      moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      if (!isOpen) {
        openListbox()
        return
      }

      selectOption(options[activeIndex])
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="planner-select" ref={selectRef}>
      <span id={labelId}>{label}</span>
      <div className="planner-select__control">
        <button
          aria-activedescendant={isOpen ? activeOptionId : undefined}
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${valueId}`}
          className={
            value ? 'planner-select__trigger' : 'planner-select__trigger is-empty'
          }
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
              return
            }

            openListbox()
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          type="button"
        >
          <span className="planner-select__value" id={valueId}>
            {selectedOption.color ? (
              <span
                aria-hidden="true"
                className="planner-select__dot"
                style={{ backgroundColor: selectedOption.color }}
              />
            ) : null}
            {selectedOption.label}
          </span>
          <span aria-hidden="true" className="planner-select__chevron">
            ⌄
          </span>
        </button>
        {isOpen ? (
          <div
            aria-label={`${label} 옵션`}
            className="planner-select__listbox"
            id={listboxId}
            role="listbox"
          >
            {options.map((option, optionIndex) => (
              <button
                aria-selected={option.value === value}
                className={[
                  'planner-select__option',
                  optionIndex === activeIndex ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                id={`${listboxId}-option-${optionIndex}`}
                key={option.value}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setActiveIndex(optionIndex)}
                role="option"
                type="button"
              >
                {option.color ? (
                  <span
                    aria-hidden="true"
                    className="planner-select__dot"
                    style={{ backgroundColor: option.color }}
                  />
                ) : null}
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const findConflictBlock = (
  candidate: PlannerBlockFormValues,
  blocks: StudyBlock[],
  editingBlockId?: string,
) =>
  blocks.find(
    (block) =>
      block.id !== editingBlockId &&
      areBlocksOverlapping(candidate, block),
  ) ?? null

const getValidationMessage = ({
  blocks,
  courseMap,
  courses,
  editingBlockId,
  values,
}: {
  blocks: StudyBlock[]
  courseMap: Map<string, Course>
  courses: Course[]
  editingBlockId?: string
  values: PlannerBlockFormValues
}) => {
  if (!courses.some((course) => course.id === values.courseId)) {
    return '강의를 선택해 주세요.'
  }

  if (
    !Number.isInteger(values.dayOfWeek) ||
    values.dayOfWeek < 0 ||
    values.dayOfWeek > 6
  ) {
    return '요일을 선택해 주세요.'
  }

  if (!isValidPlannerTimeRange(values.startTime, values.endTime)) {
    return '종료 시간은 시작 시간보다 늦어야 합니다.'
  }

  if (values.memo.length > MAX_MEMO_LENGTH) {
    return `메모는 ${MAX_MEMO_LENGTH}자 이하로 입력해 주세요.`
  }

  const conflictBlock = findConflictBlock(values, blocks, editingBlockId)

  if (conflictBlock) {
    const courseTitle =
      courseMap.get(conflictBlock.courseId)?.title ?? '알 수 없는 강의'

    return `${courseTitle}(${formatDayOfWeek(conflictBlock.dayOfWeek)}요일 ${conflictBlock.startTime} - ${conflictBlock.endTime})와 시간이 겹칩니다.`
  }

  return null
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
  const cancelDeleteButtonRef = useRef<HTMLButtonElement>(null)
  const courseMap = createCourseMap(courses)
  const deleteConfirmMessage = `'${courseMap.get(values.courseId)?.title ?? '이 강의'}'를 삭제할까요?`
  const courseOptions = [
    { label: '강의 선택', value: '' },
    ...courses.map((course) => ({
      color: course.color,
      label: course.title,
      value: course.id,
    })),
  ]
  const weekdayOptions = PLANNER_WEEKDAY_LABELS.map((weekday, dayOfWeek) => ({
    label: `${weekday}요일`,
    value: String(dayOfWeek),
  }))
  const startTimeSelectOptions = startTimeOptions.map((time) => ({
    label: time,
    value: time,
  }))
  const endTimeSelectOptions = endTimeOptions.map((time) => ({
    label: time,
    value: time,
  }))
  const memoLength = values.memo.length

  useEffect(() => {
    if (!isConfirmingDelete) return

    cancelDeleteButtonRef.current?.focus()
  }, [isConfirmingDelete])

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
      courseMap,
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
            {mode === 'edit' && onDelete ? (
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
        <div
          className="planner-delete-confirm-backdrop"
          onClick={() => setIsConfirmingDelete(false)}
        >
          <div
            className="planner-delete-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="delete-confirm-title" className="planner-delete-confirm__message">
              {deleteConfirmMessage}
            </p>
            <div className="planner-delete-confirm__actions">
              <button
                ref={cancelDeleteButtonRef}
                className="planner-modal__secondary-button"
                onClick={() => setIsConfirmingDelete(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="planner-modal__danger-button"
                onClick={onDelete}
                type="button"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
