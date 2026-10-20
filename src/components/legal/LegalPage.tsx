import { getTranslations } from "next-intl/server";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export type LegalDoc = "cgv" | "mentions" | "privacy";

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export async function LegalPage({ locale, doc }: { locale: string; doc: LegalDoc }) {
  const t = await getTranslations({ locale, namespace: `legal.${doc}` });
  const tc = await getTranslations({ locale, namespace: "legal" });
  const sections = t.raw("sections") as LegalSection[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <main className="pt-24 md:pt-36">
        <article className="max-w-3xl mx-auto px-6 pt-12 pb-20">
          <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-3 font-mono text-xs tracking-[0.12em] uppercase text-body">
            {tc("updated")}
          </p>
          <p className="mt-6 text-base md:text-lg leading-relaxed text-body">{t("intro")}</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((p) => (
                    <p key={p} className="text-base leading-relaxed text-body">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
