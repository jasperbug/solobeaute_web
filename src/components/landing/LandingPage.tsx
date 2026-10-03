import { AboutSection } from './AboutSection'
import { CalculatorSection } from './CalculatorSection'
import { CtaSection } from './CtaSection'
import { EcosystemSection } from './EcosystemSection'
import { FaqSection, type FaqItemData } from './FaqSection'
import { FeaturesSection } from './FeaturesSection'
import { HeroSection } from './HeroSection'
import { HomeStatsLine, type HomeStats } from './HomeStatsLine'
import { HowItWorksSection } from './HowItWorksSection'

export function LandingPage({ faqItems, stats = null }: { faqItems: FaqItemData[]; stats?: HomeStats | null }) {
  return (
    <main className="landing-page">
      <HeroSection />
      {stats ? <HomeStatsLine stats={stats} /> : null}
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
