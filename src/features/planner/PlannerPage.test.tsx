import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { server } from '../../mocks/server'
import { PlannerPage } from './PlannerPage'
import type { SavePlannerRequest, SavePlannerResponse } from './types'

const renderWithQueryClient = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

const dispatchBeforeUnloadEvent = () => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)

  return event
}

describe('PlannerPage', () => {
  it('저장된 주간 블록을 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(await screen.findAllByText('React 상태 관리')).toHaveLength(3)
    expect(screen.getAllByText('TypeScript 기초')).toHaveLength(3)
    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()
    expect(screen.getByText('수요일 · 14:00 - 16:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('주간 시간 그리드와 시간 라벨을 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(
      await screen.findByRole('heading', { name: '주간 학습 플래너' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '주간 시간 그리드' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('월요일')).toBeInTheDocument()
    expect(screen.getByLabelText('일요일')).toBeInTheDocument()
    expect(screen.getAllByLabelText('월요일 5/18').length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('일요일 5/24').length).toBeGreaterThan(0)
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('20:00')).toBeInTheDocument()
  })

  it('학습 블록을 시간 그리드 안에 배치한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    const grid = await screen.findByRole('region', {
      name: '주간 시간 그리드',
    })

    expect(within(grid).getByText('React 상태 관리')).toBeInTheDocument()
    expect(within(grid).getByText('09:00 - 10:30')).toBeInTheDocument()
    expect(within(grid).getByText('상태와 서버 상태 분리 복습')).toBeInTheDocument()
    expect(within(grid).getByText('TypeScript 기초')).toBeInTheDocument()
    expect(within(grid).getByText('14:00 - 16:00')).toBeInTheDocument()
  })

  it('모바일 요일 전환을 위한 요일 탭 상태를 변경한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await screen.findByRole('region', {
      name: '주간 시간 그리드',
    })

    expect(screen.getByRole('tab', { name: '월요일 5/18' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('tab', { name: '수요일 5/20' }))

    expect(screen.getByRole('tab', { name: '월요일 5/18' })).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(screen.getByRole('tab', { name: '수요일 5/20' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByLabelText('수요일')).toHaveClass('is-selected')
  })

  it('저장된 블록이 없는 주차는 빈 상태를 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2099-01-04" />)

    expect(
      await screen.findByText('이번 주 강의가 없습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '주간 시간 그리드' }),
    ).toBeInTheDocument()
  })

  it('주간 이동 버튼으로 다음 주와 이전 주를 이동한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(
      await screen.findByText('2026년 5월 18일 - 5월 24일'),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('월요일 5/18').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: '다음 주로 이동' }))

    expect(
      await screen.findByText('2026년 5월 25일 - 5월 31일'),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('월요일 5/25').length).toBeGreaterThan(0)
    expect(screen.getByText('이번 주 강의가 없습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '이전 주로 이동' }))

    expect(
      await screen.findByText('2026년 5월 18일 - 5월 24일'),
    ).toBeInTheDocument()
    expect(screen.getAllByLabelText('월요일 5/18').length).toBeGreaterThan(0)
    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()
  })

  it('dirty 상태에서 주간 이동을 취소하면 현재 주차와 draft를 유지한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.click(screen.getByRole('button', { name: '확인' }))
    await user.click(screen.getByRole('button', { name: '다음 주로 이동' }))

    const confirmDialog = screen.getByRole('alertdialog', {
      name: '저장되지 않은 변경 사항이 있습니다',
    })

    expect(
      within(confirmDialog).getByText(
        '다른 주로 이동하면 현재 주의 변경 사항이 사라집니다.',
      ),
    ).toBeInTheDocument()
    expect(
      within(confirmDialog).getByRole('button', { name: '계속 편집' }),
    ).toHaveFocus()
    expect(screen.getByText('2026년 5월 18일 - 5월 24일')).toBeInTheDocument()

    await user.click(
      within(confirmDialog).getByRole('button', { name: '계속 편집' }),
    )

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('2026년 5월 18일 - 5월 24일')).toBeInTheDocument()
    expect(screen.getByText('월요일 · 10:30 - 11:00')).toBeInTheDocument()
    expect(screen.getByText('저장되지 않은 변경 사항')).toBeInTheDocument()
  })

  it('dirty 상태에서 변경을 버리면 draft를 폐기하고 다음 주로 이동한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.click(screen.getByRole('button', { name: '확인' }))
    await user.click(screen.getByRole('button', { name: '다음 주로 이동' }))

    const confirmDialog = screen.getByRole('alertdialog', {
      name: '저장되지 않은 변경 사항이 있습니다',
    })

    await user.click(
      within(confirmDialog).getByRole('button', {
        name: '변경 버리고 이동',
      }),
    )

    expect(
      await screen.findByText('2026년 5월 25일 - 5월 31일'),
    ).toBeInTheDocument()
    expect(screen.getByText('이번 주 강의가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('월요일 · 10:30 - 11:00')).not.toBeInTheDocument()
    expect(screen.queryByText('저장되지 않은 변경 사항')).not.toBeInTheDocument()
    expect(dispatchBeforeUnloadEvent().defaultPrevented).toBe(false)
  })

  it('빈 슬롯 클릭 시 기본 시간이 채워진 추가 모달을 연다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '모달 닫기' })).toHaveTextContent(
      '×',
    )
    expect(screen.queryByText('로컬 편집')).not.toBeInTheDocument()
    expect(screen.getByLabelText('요일')).toHaveValue('0')
    expect(screen.getByLabelText('시작 시간')).toHaveValue('10:30')
    expect(screen.getByLabelText('종료 시간')).toHaveValue('11:00')
  })

  it('추가 모달 확인 시 draft 블록을 추가하고 dirty 상태가 된다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(screen.getByText('월요일 · 10:30 - 11:00')).toBeInTheDocument()
    expect(screen.getByText('저장되지 않은 변경 사항')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(dispatchBeforeUnloadEvent().defaultPrevented).toBe(true)
  })

  it('변경 사항이 없으면 저장 버튼을 비활성화한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(await screen.findByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('저장 성공 시 서버 응답으로 동기화하고 dirty 상태를 초기화한다', async () => {
    const user = userEvent.setup()
    let savedBlocksPayload: SavePlannerRequest['blocks'] | null = null

    server.use(
      http.put('/api/planner', async ({ request }) => {
        const saveRequest = (await request.json()) as SavePlannerRequest
        savedBlocksPayload = saveRequest.blocks
        await new Promise((resolve) => {
          setTimeout(resolve, 20)
        })

        return HttpResponse.json<SavePlannerResponse>({
          weekStart: saveRequest.weekStart,
          blocks: saveRequest.blocks.map((block, index) => ({
            id: block.id ?? `block-saved-${index}`,
            courseId: block.courseId,
            dayOfWeek: block.dayOfWeek,
            startTime: block.startTime,
            endTime: block.endTime,
            ...(block.memo ? { memo: block.memo } : {}),
          })),
        })
      }),
    )

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.click(screen.getByRole('button', { name: '확인' }))

    const saveButton = screen.getByRole('button', { name: '저장' })

    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    expect(screen.getByRole('button', { name: '저장 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '이전 주로 이동' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '다음 주로 이동' })).toBeDisabled()
    expect(await screen.findByText('저장되었습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    expect(dispatchBeforeUnloadEvent().defaultPrevented).toBe(false)

    await waitFor(() => {
      expect(savedBlocksPayload).not.toBeNull()
    })
    expect(savedBlocksPayload).toContainEqual({
      courseId: 'course-react',
      dayOfWeek: 0,
      startTime: '10:30',
      endTime: '11:00',
    })
  })

  it('저장 실패 시 에러를 보여주고 draft 변경 사항을 유지한다', async () => {
    const user = userEvent.setup()

    server.use(
      http.put('/api/planner', () =>
        HttpResponse.json(
          {
            code: 'INVALID_BLOCK',
            message: '저장할 수 없는 블록입니다.',
          },
          { status: 400 },
        ),
      ),
    )

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.click(screen.getByRole('button', { name: '확인' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('저장할 수 없는 블록입니다.')).toBeInTheDocument()
    expect(screen.getByText('월요일 · 10:30 - 11:00')).toBeInTheDocument()
    expect(screen.getByText('저장되지 않은 변경 사항')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
    expect(dispatchBeforeUnloadEvent().defaultPrevented).toBe(true)
  })

  it('충돌 블록을 경고 메시지와 배지로 표시한다', async () => {
    server.use(
      http.get('/api/planner', () =>
        HttpResponse.json({
          weekStart: '2026-05-18',
          blocks: [
            {
              id: 'block-1',
              courseId: 'course-react',
              dayOfWeek: 0,
              startTime: '09:00',
              endTime: '10:30',
            },
            {
              id: 'block-2',
              courseId: 'course-typescript',
              dayOfWeek: 0,
              startTime: '10:00',
              endTime: '11:00',
            },
          ],
        }),
      ),
    )

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(
      await screen.findByText(
        'React 상태 관리(월요일 09:00 - 10:30)와 TypeScript 기초(월요일 10:00 - 11:00) 시간이 겹칩니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('시간 충돌').length).toBeGreaterThanOrEqual(2)
    expect(
      screen.getByRole('button', {
        name: 'React 상태 관리 09:00 - 10:30 편집',
      }),
    ).toHaveClass('is-conflict')
  })

  it('30분 블록은 compact 표시를 적용하고 그리드 메모를 숨긴다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.type(screen.getByLabelText('메모'), '30분 블록 메모')
    await user.click(screen.getByRole('button', { name: '확인' }))

    const gridBlock = screen.getByRole('button', {
      name: 'React 상태 관리 10:30 - 11:00 편집',
    })

    expect(gridBlock).toHaveClass('is-compact')
    expect(
      within(
        screen.getByRole('region', { name: '주간 시간 그리드' }),
      ).queryByText('30분 블록 메모'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('30분 블록 메모')).toBeInTheDocument()
  })

  it('기존 블록 클릭 시 값을 수정한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: 'React 상태 관리 09:00 - 10:30 편집',
      }),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByText('학습 블록 편집')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('종료 시간'), '11:00')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(screen.getByText('월요일 · 09:00 - 11:00')).toBeInTheDocument()
    expect(screen.getByText('저장되지 않은 변경 사항')).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 확인 단계를 거쳐 draft 블록을 제거한다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: 'React 상태 관리 09:00 - 10:30 편집',
      }),
    )
    await user.click(screen.getByRole('button', { name: '삭제' }))

    const confirmDialog = screen.getByRole('alertdialog')
    expect(
      within(confirmDialog).getByText("'React 상태 관리'를 삭제할까요?"),
    ).toBeInTheDocument()
    expect(within(confirmDialog).getByRole('button', { name: '취소' })).toHaveFocus()
    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()

    await user.click(within(confirmDialog).getByRole('button', { name: '삭제' }))

    expect(screen.queryByText('월요일 · 09:00 - 10:30')).not.toBeInTheDocument()
    expect(screen.getByText('저장되지 않은 변경 사항')).toBeInTheDocument()
  })

  it('삭제 확인 단계에서 취소하면 블록이 유지된다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: 'React 상태 관리 09:00 - 10:30 편집',
      }),
    )
    await user.click(screen.getByRole('button', { name: '삭제' }))

    const confirmDialog = screen.getByRole('alertdialog')
    expect(
      within(confirmDialog).getByText("'React 상태 관리'를 삭제할까요?"),
    ).toBeInTheDocument()
    expect(within(confirmDialog).getByRole('button', { name: '취소' })).toHaveFocus()

    await user.click(within(confirmDialog).getByRole('button', { name: '취소' }))

    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('종료 시간이 시작 시간보다 늦지 않으면 draft에 반영하지 않는다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.selectOptions(screen.getByLabelText('종료 시간'), '10:30')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(
      screen.getByText('종료 시간은 시작 시간보다 늦어야 합니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('월요일 · 10:30 - 10:30')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('겹치는 시간 블록이면 충돌 메시지를 보여주고 draft에 반영하지 않는다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 09:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-typescript')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(
      screen.getByText(
        'React 상태 관리(월요일 09:00 - 10:30)와 시간이 겹칩니다.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('월요일 · 09:30 - 10:00')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('메모가 200자를 초과하면 draft에 반영하지 않는다', async () => {
    const user = userEvent.setup()

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    await user.click(
      await screen.findByRole('button', {
        name: '월요일 10:30 학습 블록 추가',
      }),
    )
    await user.selectOptions(screen.getByLabelText('강의'), 'course-react')
    await user.type(screen.getByLabelText('메모'), 'a'.repeat(201))
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(
      screen.getByText('메모는 200자 이하로 입력해 주세요.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('월요일 · 10:30 - 11:00')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })

  it('플래너 조회 실패 시 에러와 재시도 버튼을 렌더링한다', async () => {
    server.use(
      http.get('/api/planner', () =>
        HttpResponse.json(
          {
            code: 'INVALID_BLOCK',
            message: '플래너 조회에 실패했습니다.',
          },
          { status: 500 },
        ),
      ),
    )

    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(
      await screen.findByText('플래너 정보를 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(screen.getByText('플래너 조회에 실패했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})
