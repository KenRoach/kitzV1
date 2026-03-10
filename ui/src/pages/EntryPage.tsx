import { useState, useEffect } from 'react'
import { DashboardPage } from './DashboardPage'
import { MobileLandingPage } from './MobileLandingPage'
import { OnboardingWizard, isOnboardingComplete } from '@/components/OnboardingWizard'

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
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Show mobile landing only on first visit from a mobile device
    if (isMobile && !localStorage.getItem(MOBILE_SEEN_KEY)) {
      setShowLanding(true)
    }
    // Show onboarding wizard for first-time web visitors (after mobile landing is dismissed)
    else if (!isOnboardingComplete()) {
      setShowOnboarding(true)
    }
  }, [isMobile])

  const handleEnter = () => {
    localStorage.setItem(MOBILE_SEEN_KEY, '1')
    setShowLanding(false)
    // After mobile landing, check if onboarding is needed
    if (!isOnboardingComplete()) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  if (showLanding) {
    return <MobileLandingPage onEnter={handleEnter} />
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  return <DashboardPage />
}
