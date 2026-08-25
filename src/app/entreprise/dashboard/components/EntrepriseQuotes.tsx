"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, FileText, CheckCircle, XCircle, Tag } from "@phosphor-icons/react";
import { QuoteRequestForm } from "@/components/client/QuoteRequestForm";
import { toIntlLocale } from "@/lib/intl-locale";

type QuoteStatus = "pending" | "in_progress" | "sent" | "accepted" | "rejected" | "expired";

interface Quote {
  id: number;
  service: string;
  preferredDate: string | null;
  message: string;
  status: QuoteStatus;
  estimatedPrice: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<QuoteStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  sent: "bg-green-50 text-green-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-600",
};

export function EntrepriseQuotes() {
  const { data: session } = useSession();
  const t = useTranslations("entreprise.quotes");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadQuotes = async () => {
    if (!session?.user?.email) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes/client?email=${encodeURIComponent(session.user.email)}`);
      const data = await res.json();
      if (data.success) setQuotes(data.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des devis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [session?.user?.email]);

  const handleAction = async (quoteId: number, action: "accept" | "reject" | "negotiate") => {
    if (action === "accept" && !window.confirm(t("confirmAccept"))) return;

    let message = "";
    if (action === "negotiate") {
      message = window.prompt(t("negotiatePrompt")) || "";
      if (!message) return;
    } else if (action === "reject") {
      message = window.prompt(t("rejectPrompt")) || "";
    }

    setProcessingId(quoteId);
    try {
      const res = await fetch("/api/quotes/client/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, action, message }),
      });
      const data = await res.json();
      if (data.success) {
        await loadQuotes();
      } else {
        window.alert(data.error || t("actionError"));
      }
    } catch (error) {
      console.error("Erreur lors de l'action sur le devis:", error);
      window.alert(t("actionError"));
    } finally {
      setProcessingId(null);
    }
  };

  if (showForm) {
    return <QuoteRequestForm onClose={() => { setShowForm(false); loadQuotes(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">{t("title")}</h3>
          <p className="text-sm text-[#6E6A63]">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} weight="bold" /> {t("newRequest")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6E6A63]">{t("loading")}</p>
      ) : quotes.length === 0 ? (
        <div className="bg-white border border-border rounded p-10 text-center text-sm text-[#6E6A63]">{t("empty")}</div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const tStatus = t(`status.${quote.status}`);
            return (
              <div key={quote.id} className="bg-white border border-border rounded p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-accent" weight="light" />
                    <span className="text-sm font-semibold text-foreground">{quote.service}</span>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[quote.status]}`}>
                    {tStatus}
                  </span>
                </div>
                <p className="text-sm text-[#3d3a35] mb-3 whitespace-pre-line">{quote.message}</p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)]">
                  <span>{t("requestedOn")}: {new Date(quote.createdAt).toLocaleDateString(intlLocale)}</span>
                  {quote.preferredDate && (
                    <span>{t("preferredDate")}: {new Date(quote.preferredDate).toLocaleDateString(intlLocale)}</span>
                  )}
                  {quote.estimatedPrice && (
                    <span className="font-semibold text-foreground">
                      {t("estimatedPrice")}: {Number.parseFloat(quote.estimatedPrice).toLocaleString(intlLocale)} FCFA
                    </span>
                  )}
                </div>

                {quote.status === "sent" && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      disabled={processingId === quote.id}
                      onClick={() => handleAction(quote.id, "accept")}
                      className="inline-flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-accent-hover disabled:opacity-60"
                    >
                      <CheckCircle size={13} /> {t("accept")}
                    </button>
                    <button
                      type="button"
                      disabled={processingId === quote.id}
                      onClick={() => handleAction(quote.id, "negotiate")}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded text-xs font-semibold text-[#6E6A63] hover:text-[#12100E] disabled:opacity-60"
                    >
                      <Tag size={13} /> {t("negotiate")}
                    </button>
                    <button
                      type="button"
                      disabled={processingId === quote.id}
                      onClick={() => handleAction(quote.id, "reject")}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
                    >
                      <XCircle size={13} /> {t("reject")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
