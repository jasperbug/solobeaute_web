import { AboutSection } from './AboutSection'
import { CtaSection } from './CtaSection'
import { EcosystemSection } from './EcosystemSection'
import { FaqSection } from './FaqSection'
import { FeaturesSection } from './FeaturesSection'
import { HeroSection } from './HeroSection'
import { HowItWorksSection } from './HowItWorksSection'

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <EcosystemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AboutSection />
      <FaqSection />
      <CtaSection />
    </>
  )
}
