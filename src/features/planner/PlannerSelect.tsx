import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export interface PlannerSelectOption {
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

const getSelectedOptionIndex = (
  options: PlannerSelectOption[],
  value: string,
) => {
  const selectedIndex = options.findIndex((option) => option.value === value)

  return selectedIndex >= 0 ? selectedIndex : 0
}

export const PlannerSelect = ({
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
