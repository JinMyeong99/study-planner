import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'
import { shouldEnableMocking } from './mocks/config'

const renderApp = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
}

const renderMockStartupError = () => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <main className="startup-error" role="alert">
        <strong>Mock API를 시작하지 못했습니다.</strong>
        <p>
          페이지를 새로고침하거나 개발 서버를 다시 실행해 주세요. 실제 API를
          사용할 경우 <code>VITE_ENABLE_MOCKS=false</code>로 Mock을 끌 수
          있습니다.
        </p>
      </main>
    </StrictMode>,
  )
}

const enableMocking = async () => {
  if (!import.meta.env.DEV || !shouldEnableMocking(import.meta.env)) {
    return
  }

  const { worker } = await import('./mocks/browser')

  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}

const startApp = async () => {
  try {
    await enableMocking()
    renderApp()
  } catch (error) {
    console.error('Mock API를 시작하지 못했습니다.', error)
    renderMockStartupError()
  }
}

void startApp()
