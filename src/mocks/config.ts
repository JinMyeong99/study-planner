interface MockEnv {
  DEV?: boolean
  MODE?: string
  VITE_ENABLE_MOCKS?: string
}

export const shouldEnableMocking = (env: MockEnv) =>
  env.VITE_ENABLE_MOCKS !== 'false'
