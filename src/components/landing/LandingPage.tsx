import type { CalculatorData } from '@/lib/calculatorRates'

import { AboutSection } from './AboutSection'
import { CalculatorSection } from './CalculatorSection'
import { CtaSection } from './CtaSection'
import { EcosystemSection } from './EcosystemSection'
import { FaqSection, type FaqItemData } from './FaqSection'
import { FeaturesSection } from './FeaturesSection'
import { HeroSection } from './HeroSection'
import { HomeStatsLine, type HomeStats } from './HomeStatsLine'
import { HowItWorksSection } from './HowItWorksSection'

export function LandingPage({
  faqItems,
  stats = null,
  calculator,
}: {
  faqItems: FaqItemData[]
  stats?: HomeStats | null
  calculator: CalculatorData
}) {
  return (
    <main className="landing-page">
      <HeroSection />
      {stats ? <HomeStatsLine stats={stats} /> : null}
      <EcosystemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CalculatorSection data={calculator} />
      <AboutSection />
      <FaqSection items={faqItems} />
      <CtaSection />
    </main>
  )
}
