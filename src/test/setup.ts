import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '../mocks/server'
import { resetPlannerStore } from '../mocks/plannerStore'

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetPlannerStore()
})

afterAll(() => {
  server.close()
})
