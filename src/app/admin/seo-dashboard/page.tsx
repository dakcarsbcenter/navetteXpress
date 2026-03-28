import Link from 'next/link';
import { requireAdminRole } from '@/utils/admin-permissions';
import { Navigation } from '@/components/navigation';
import {
  competitorBenchmarkRows,
  geoExpansionRows,
  monthlyMoneyPageRefreshChecklist,
  routeClusterTargets,
  seoExecutionSprints,
  weeklyDashboardChecklist,
  weeklySeoKpiRows,
} from '@/lib/seo-dashboard';

export default async function SeoDashboardPage() {
  await requireAdminRole();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navigation variant="solid" />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-widest text-amber-600 dark:text-amber-400">Dashboard hebdomadaire unique</p>
          <h1 className="text-4xl font-bold">SEO Performance: Plan J90 puis J91-J180</h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-3xl">
            Ce tableau centralise la baseline J30, les cibles J90/J180 et le plan de domination routes.
            Mettez a jour les chiffres chaque semaine pour prioriser les refresh, les tests CTR et l expansion geographique.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700/70 text-left">
              <tr>
                <th className="px-4 py-3">Metrique</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Baseline J30</th>
                <th className="px-4 py-3">Cible J90</th>
                <th className="px-4 py-3">Cible J180</th>
                <th className="px-4 py-3">Note operationnelle</th>
              </tr>
            </thead>
            <tbody>
              {weeklySeoKpiRows.map((row) => (
                <tr key={row.metric} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-medium">{row.metric}</td>
                  <td className="px-4 py-3">{row.source}</td>
                  <td className="px-4 py-3">{row.baseline}</td>
                  <td className="px-4 py-3">{row.target90d}</td>
                  <td className="px-4 py-3">{row.target180d}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 overflow-hidden">
          <header className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-semibold">Clusters routes: Top 10 / Top 3 / CTR</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700/70 text-left">
              <tr>
                <th className="px-4 py-3">Cluster</th>
                <th className="px-4 py-3">Top 10 (base)</th>
                <th className="px-4 py-3">Top 10 (cible)</th>
                <th className="px-4 py-3">Top 3 (base)</th>
                <th className="px-4 py-3">Top 3 (cible)</th>
                <th className="px-4 py-3">CTR (base)</th>
                <th className="px-4 py-3">CTR (cible)</th>
              </tr>
            </thead>
            <tbody>
              {routeClusterTargets.map((row) => (
                <tr key={row.cluster} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-medium">{row.cluster}</td>
                  <td className="px-4 py-3">{row.baselineTop10}</td>
                  <td className="px-4 py-3">{row.targetTop10}</td>
                  <td className="px-4 py-3">{row.baselineTop3}</td>
                  <td className="px-4 py-3">{row.targetTop3}</td>
                  <td className="px-4 py-3">{row.baselineCtr}</td>
                  <td className="px-4 py-3">{row.targetCtr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 overflow-hidden">
          <header className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-semibold">Benchmark vs aerocabsenegal.com</h2>
          </header>
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700/70 text-left">
              <tr>
                <th className="px-4 py-3">Metrique</th>
                <th className="px-4 py-3">Navette Xpress</th>
                <th className="px-4 py-3">Concurrent</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {competitorBenchmarkRows.map((row) => (
                <tr key={row.metric} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3 font-medium">{row.metric}</td>
                  <td className="px-4 py-3">{row.navetteXpress}</td>
                  <td className="px-4 py-3">{row.competitor}</td>
                  <td className="px-4 py-3">{row.target}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Execution sprints J31-J180</h2>
            <div className="space-y-4">
              {seoExecutionSprints.map((sprint) => (
                <div key={sprint.phase} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="font-semibold text-amber-600 dark:text-amber-400">{sprint.phase}</p>
                  <p className="font-medium mt-1">{sprint.objective}</p>
                  <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    {sprint.keyActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                  <p className="text-sm mt-3"><span className="font-medium">Livrable:</span> {sprint.output}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Refresh mensuel pages money</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-200">
              {monthlyMoneyPageRefreshChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold mb-2">Expansion geographique par ROI reel</h3>
              <ul className="space-y-2 text-sm">
                {geoExpansionRows.map((row) => (
                  <li key={row.zone} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                    <p className="font-medium">{row.zone}</p>
                    <p className="text-slate-600 dark:text-slate-300">Trigger: {row.trigger}</p>
                    <p className="text-slate-600 dark:text-slate-300">Pack contenu: {row.pagePack}</p>
                    <p className="text-slate-600 dark:text-slate-300">KPI gate: {row.kpiGate}</p>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 p-6">
            <h2 className="text-2xl font-semibold mb-4">Rituel hebdomadaire</h2>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 dark:text-slate-200">
              {weeklyDashboardChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 p-6 space-y-3">
            <h2 className="text-2xl font-semibold">Acces rapide</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/routes" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-500 transition-colors">
                Hub routes
              </Link>
              <Link href="/services" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-500 transition-colors">
                Hub services
              </Link>
              <Link href="/faq" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-500 transition-colors">
                FAQ
              </Link>
              <Link href="/reservation" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-amber-500 transition-colors">
                Reservation
              </Link>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 pt-2">
              Astuce: prioriser les pages en position 4-15 et avec CTR sous la mediane pour des gains rapides.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}