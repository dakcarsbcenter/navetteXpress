import { getTranslations } from "next-intl/server";
import { Star, GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { getPublishedReviewsSafe } from "@/lib/public-reviews";
import { GOOGLE_BUSINESS_URL } from "@/lib/contact";

/**
 * Preuve sociale réelle : avis clients approuvés (getPublishedReviewsSafe) et
 * lien vers la fiche Google. Sans avis publié, seul le lien Google s'affiche :
 * aucun témoignage n'est inventé pour « remplir ».
 *
 * Pas d'aggregateRating en JSON-LD : Google ignore les notes qu'une entreprise
 * publie sur ses propres avis (« self-serving reviews ») et une note
 * non vérifiable exposerait à une action manuelle.
 */
export async function ReviewsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoneyPage.reviews" });
  const reviews = await getPublishedReviewsSafe();

  const googleLink = (
    <a
      href={GOOGLE_BUSINESS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"
    >
      <GoogleLogo size={18} weight="bold" aria-hidden />
      {t("google")}
    </a>
  );

  if (reviews.length === 0) {
    return <div className="text-sm">{googleLink}</div>;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface-2/40 p-6 space-y-5" aria-labelledby="reviews-heading">
      <div className="space-y-1">
        <h2 id="reviews-heading" className="text-2xl font-display">{t("heading")}</h2>
        <p className="text-sm text-text-muted">{t("intro")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.slice(0, 4).map((review) => (
          <figure key={review.id} className="rounded-xl border border-border bg-background p-5 space-y-3">
            <div className="flex gap-0.5 text-gold" role="img" aria-label={t("stars", { rating: review.rating })}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} weight={i < review.rating ? "fill" : "regular"} aria-hidden />
              ))}
            </div>
            <blockquote className="text-text-secondary leading-relaxed">« {review.comment} »</blockquote>
            <figcaption className="text-sm font-semibold text-foreground">{review.author}</figcaption>
          </figure>
        ))}
      </div>
      {googleLink}
    </section>
  );
}
