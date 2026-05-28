import { AboutSection } from './AboutSection'
import { CalculatorSection } from './CalculatorSection'
import { CtaSection } from './CtaSection'
import { EcosystemSection } from './EcosystemSection'
import { FaqSection } from './FaqSection'
import { FeaturesSection } from './FeaturesSection'
import { HeroSection } from './HeroSection'
import { HowItWorksSection } from './HowItWorksSection'

export function LandingPage() {
  return (
    <main className="landing-page">
      <HeroSection />
      <EcosystemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CalculatorSection />
      <AboutSection />
      <FaqSection />
      <CtaSection />
    </main>
  )
}
