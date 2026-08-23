import type { Metadata } from 'next'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { QuoteRequestForm } from '@/components/client/QuoteRequestForm'

export const metadata: Metadata = {
  title: 'Demander un devis | Navette Xpress',
  description: 'Demandez votre devis personnalisé pour vos besoins de transport avec Navette Xpress. Service rapide et professionnel.',
}

export default function QuoteRequestPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />
      <div className="pt-28 pb-16">
        <QuoteRequestForm />
      </div>
      <Footer />
    </div>
  )
}
