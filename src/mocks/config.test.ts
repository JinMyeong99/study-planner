import { describe, expect, it } from 'vitest'

import { shouldEnableMocking } from './config'

describe('mock config', () => {
  it('별도 설정이 없으면 Mock API를 활성화한다', () => {
    expect(shouldEnableMocking({})).toBe(true)
  })

  it('VITE_ENABLE_MOCKS=false이면 Mock API를 비활성화한다', () => {
    expect(shouldEnableMocking({ VITE_ENABLE_MOCKS: 'false' })).toBe(false)
  })
})
