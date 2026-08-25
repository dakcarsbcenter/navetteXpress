"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Receipt, EnvelopeSimple, Phone, DownloadSimple } from "@phosphor-icons/react";
import { downloadInvoicePDF } from "@/lib/invoice-pdf";
import { toIntlLocale } from "@/lib/intl-locale";

type InvoiceStatus = "draft" | "pending" | "paid" | "cancelled" | "overdue";
type Filter = "all" | "pending" | "paid" | "overdue";

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  service: string;
  amount: string;
  taxRate: string;
  taxAmount: string;
  totalAmount: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string | null;
  quote?: { message: string; clientNotes: string };
}

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  overdue: "bg-red-50 text-red-700",
};

export function EntrepriseInvoices() {
  const t = useTranslations("entreprise.invoices");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.success) setInvoices(data.invoices || []);
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((inv) => inv.status === filter);
  }, [invoices, filter]);

  const buildInvoiceData = (invoice: Invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerPhone: invoice.customerPhone || "",
    service: invoice.service,
    amountHT: Number.parseFloat(invoice.amount),
    vatAmount: Number.parseFloat(invoice.taxAmount),
    amountTTC: Number.parseFloat(invoice.totalAmount),
    taxRate: Number.parseFloat(invoice.taxRate),
    issueDate: new Date(invoice.issueDate).toLocaleDateString(intlLocale),
    dueDate: new Date(invoice.dueDate).toLocaleDateString(intlLocale),
    status: invoice.status,
    notes: invoice.notes || invoice.quote?.clientNotes || undefined,
  });

  const handleDownload = async (invoice: Invoice) => {
    await downloadInvoicePDF(buildInvoiceData(invoice));
  };

  const toggleSelected = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadSelection = async () => {
    setDownloading(true);
    try {
      for (const invoice of filtered.filter((inv) => selected.has(inv.id))) {
        await downloadInvoicePDF(buildInvoiceData(invoice));
      }
    } finally {
      setDownloading(false);
    }
  };

  const filters: Filter[] = ["all", "pending", "paid", "overdue"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-white p-1">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  filter === f ? "bg-[#12100E] text-white" : "text-[#6E6A63] hover:text-[#12100E]"
                }`}
              >
                {t(`filters.${f}`)}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleDownloadSelection}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-accent-hover disabled:opacity-60"
            >
              <DownloadSimple size={14} /> {t("downloadSelection")} ({selected.size})
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[#6E6A63]">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded p-10 text-center text-sm text-[#6E6A63]">{t("empty")}</div>
        ) : (
          <div className="bg-white border border-border rounded overflow-hidden">
            {filtered.map((invoice) => (
              <div key={invoice.id} className="flex items-center gap-3 px-5 py-4 border-b border-border last:border-0">
                <input
                  type="checkbox"
                  checked={selected.has(invoice.id)}
                  onChange={() => toggleSelected(invoice.id)}
                  className="h-4 w-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground font-[family-name:var(--font-ibm-plex-mono)]">{invoice.invoiceNumber}</span>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_STYLE[invoice.status]}`}>
                      {t(`status.${invoice.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-[#6E6A63] truncate">{invoice.service}</p>
                  <p className="text-xs text-[#6E6A63] font-[family-name:var(--font-ibm-plex-mono)]">
                    {t("dueDate")}: {new Date(invoice.dueDate).toLocaleDateString(intlLocale)}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground font-[family-name:var(--font-ibm-plex-mono)] shrink-0">
                  {Number.parseFloat(invoice.totalAmount).toLocaleString(intlLocale)} FCFA
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(invoice)}
                  aria-label={t("download")}
                  className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded border border-border text-[#6E6A63] hover:text-[#12100E] hover:border-[#12100E]"
                >
                  <DownloadSimple size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-border rounded p-5 space-y-3 h-fit">
        <div className="flex items-center gap-2 text-[#6E6A63]">
          <Receipt size={16} weight="light" />
          <span className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] uppercase">
            {t("invoiceCard.title")}
          </span>
        </div>
        <p className="text-sm text-[#3d3a35]">{t("invoiceCard.description")}</p>
        <a href="mailto:entreprises@navettexpress.com" className="flex items-center gap-2 text-sm text-accent font-medium hover:text-[#12100E] transition-colors">
          <EnvelopeSimple size={16} weight="light" /> entreprises@navettexpress.com
        </a>
        <a href="tel:+221784651302" className="flex items-center gap-2 text-sm text-accent font-medium hover:text-[#12100E] transition-colors">
          <Phone size={16} weight="light" /> +221 78 465 13 02
        </a>
      </div>
    </div>
  );
}
