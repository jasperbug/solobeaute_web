import { AboutSection } from './AboutSection'
import { CalculatorSection } from './CalculatorSection'
import { CtaSection } from './CtaSection'
import { EcosystemSection } from './EcosystemSection'
import { FaqSection, type FaqItemData } from './FaqSection'
import { FeaturesSection } from './FeaturesSection'
import { HeroSection } from './HeroSection'
import { HowItWorksSection } from './HowItWorksSection'

export function LandingPage({ faqItems }: { faqItems: FaqItemData[] }) {
  return (
    <main className="landing-page">
      <HeroSection />
      <EcosystemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CalculatorSection />
      <AboutSection />
      <FaqSection items={faqItems} />
      <CtaSection />
    </main>
  )
}
