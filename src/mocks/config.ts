interface MockEnv {
  readonly [key: string]: string | boolean | undefined
  VITE_ENABLE_MOCKS?: string
}

export const shouldEnableMocking = (env: MockEnv) =>
  env.VITE_ENABLE_MOCKS !== 'false'
