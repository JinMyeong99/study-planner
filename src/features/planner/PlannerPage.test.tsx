import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
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

    expect(await screen.findByText('React 상태 관리')).toBeInTheDocument()
    expect(screen.getByText('TypeScript 기초')).toBeInTheDocument()
    expect(screen.getByText('월요일 · 09:00 - 10:30')).toBeInTheDocument()
    expect(screen.getByText('수요일 · 14:00 - 16:00')).toBeInTheDocument()
    expect(screen.getByText('변경 없음')).toBeInTheDocument()
  })

  it('저장된 블록이 없는 주차는 빈 상태를 렌더링한다', async () => {
    renderWithQueryClient(<PlannerPage initialWeekStart="2099-01-04" />)

    expect(
      await screen.findByText('이번 주 학습 블록이 없습니다.'),
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
