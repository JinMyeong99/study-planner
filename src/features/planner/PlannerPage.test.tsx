import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { server } from '../../mocks/server'
import { PlannerPage } from './PlannerPage'

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

describe('PlannerPage', () => {
  it('저장된 주간 블록을 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(await screen.findAllByText('React 상태 관리')).toHaveLength(2)
    expect(screen.getAllByText('TypeScript 기초')).toHaveLength(2)
    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()
    expect(screen.getByText('수요일 · 14:00 - 16:00')).toBeInTheDocument()
    expect(screen.getByText('변경 없음')).toBeInTheDocument()
  })

  it('주간 시간 그리드와 시간 라벨을 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2026-05-18" />)

    expect(
      await screen.findByRole('heading', { name: '주간 시간표' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '주간 시간 그리드' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('월요일')).toBeInTheDocument()
    expect(screen.getByLabelText('일요일')).toBeInTheDocument()
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
    expect(within(grid).getByText('TypeScript 기초')).toBeInTheDocument()
    expect(within(grid).getByText('14:00 - 16:00')).toBeInTheDocument()
  })

  it('저장된 블록이 없는 주차는 빈 상태를 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2099-01-04" />)

    expect(
      await screen.findByText('이번 주 학습 블록이 없습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: '주간 시간 그리드' }),
    ).toBeInTheDocument()
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
