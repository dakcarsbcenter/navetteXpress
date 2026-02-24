import { QuoteRequestForm } from '@/components/client/QuoteRequestForm'

export default function QuoteRequestPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <QuoteRequestForm />
    </div>
  )
}

export const metadata = {
  title: 'Demander un devis - NavetteXpress',
  description: 'Demandez votre devis personnalisé pour vos besoins de transport avec NavetteXpress. Service rapide et professionnel.',
}
