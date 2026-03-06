import { useState, useEffect } from 'react'
import { DashboardPage } from './DashboardPage'
import { MobileLandingPage } from './MobileLandingPage'

const MOBILE_SEEN_KEY = 'kitz_mobile_onboarded'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

export function EntryPage() {
  const isMobile = useIsMobile()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    // Show mobile landing only on first visit from a mobile device
    if (isMobile && !localStorage.getItem(MOBILE_SEEN_KEY)) {
      setShowLanding(true)
    }
  }, [isMobile])

  const handleEnter = () => {
    localStorage.setItem(MOBILE_SEEN_KEY, '1')
    setShowLanding(false)
  }

  if (showLanding) {
    return <MobileLandingPage onEnter={handleEnter} />
  }

  return <DashboardPage />
}
