import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('학습 플래너 임시 화면을 렌더링한다', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: '주간 학습 플래너' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('학습 스케줄 편집 화면을 준비 중입니다.'),
    ).toBeInTheDocument()
  })
})
