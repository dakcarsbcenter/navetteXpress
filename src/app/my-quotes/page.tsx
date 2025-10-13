import { ClientQuotesView } from '@/components/client/ClientQuotesView'

export default function MyQuotesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <ClientQuotesView />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Mes devis - NavetteXpress',
  description: 'Consultez et suivez l\'état de vos demandes de devis avec NavetteXpress.',
}