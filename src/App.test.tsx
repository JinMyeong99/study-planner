import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import App from './App'

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

describe('App', () => {
  it('주간 학습 플래너 화면을 렌더링한다', async () => {
    renderWithQueryClient(<App />)

    expect(
      screen.getByRole('heading', { name: '주간 학습 플래너' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('서버 상태:')).toBeInTheDocument()
  })
})
