"use client"
import AuthModal from '@/components/AuthModal'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import HowItWorksSection from '@/components/HowItWorksSection'
import ReadyToVerifySection from '@/components/ReadyToVerifySection'
import StatsSection from '@/components/StatsSection'
import WhyTrustSection from '@/components/WhyTrustSection'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const LandingPage = ({ onAuthenticated }) => {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [initialRole, setInitialRole] = useState(null) // 'citizen' | 'doctor' | null

  const openAuth = (role = null) => {
    setInitialRole(role)
    setAuthOpen(true)
  }

  const closeAuth = () => {
    setAuthOpen(false)
  }

  return (
    <div>
      <Header
        onCitizenClick={() => router.push('/login/citizen')}
        onDoctorClick={() => router.push('/login/doctor')}
      />
      <HeroSection
        onStartVerify={() => openAuth('citizen')}
        onJoinDoctor={() => openAuth('doctor')}
      />
      <StatsSection />
      <WhyTrustSection />
      <HowItWorksSection />
      <ReadyToVerifySection onGetStarted={() => openAuth('citizen')} />
      <Footer />
      <AuthModal
        open={authOpen}
        onClose={closeAuth}
        initialRole={initialRole}
        onAuthenticated={onAuthenticated}
      />
    </div>
  )
}

export default LandingPage
