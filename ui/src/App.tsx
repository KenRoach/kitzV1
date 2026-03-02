import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { setLocale } from '@/lib/i18n'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ToastContainer } from '@/components/ui/ToastContainer'

// Code-split heavy pages (audit finding 6f)
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const WhatsAppPage = lazy(() => import('@/pages/WhatsAppPage').then(m => ({ default: m.WhatsAppPage })))
const LearnPage = lazy(() => import('@/pages/LearnPage').then(m => ({ default: m.LearnPage })))
const GamePage = lazy(() => import('@/pages/GamePage').then(m => ({ default: m.GamePage })))
const UIPreviewPage = lazy(() => import('@/pages/UIPreviewPage'))

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const interfaceLang = useSettingsStore((s) => s.interfaceLang)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Sync i18n locale on mount and when language changes
  useEffect(() => {
    const code = interfaceLang === 'English' ? 'en' : interfaceLang === 'Español' ? 'es' : 'pt'
    setLocale(code)
  }, [interfaceLang])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/connect-whatsapp"
              element={
                <ProtectedRoute>
                  <WhatsAppPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/learn"
              element={
                <ProtectedRoute>
                  <LearnPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              }
            />
            <Route path="/ui" element={<UIPreviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
