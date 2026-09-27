"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X, CheckCircle, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { fetchPublicApi } from "@/lib/apiClient";

/**
 * Demande de convention entreprise. Les deux CTA de /entreprises menaient
 * auparavant au formulaire de devis générique, qui ne demande aucune
 * information B2B et renvoie ensuite vers un dashboard protégé — un prospect
 * anonyme atterrissait donc sur l'écran de connexion après avoir écrit.
 *
 * Aucune modale accessible n'existait dans le repo : celle-ci reprend le
 * fonctionnement de QuickSignupModal (backdrop cliquable, fermeture Escape,
 * scroll du document verrouillé) en y ajoutant la sémantique dialog.
 */

const monoLabel = "font-[family-name:var(--font-ibm-plex-mono)]";
const fieldClass =
  "w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors";
const labelClass = `${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`;

const COMPANY_TYPES = ["hotel", "entreprise", "ong", "mission-diplomatique", "autre"] as const;
const MONTHLY_VOLUMES = ["moins-10", "10-30", "30-100", "plus-100"] as const;

interface ConventionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  companyName: "",
  companyType: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  monthlyVolume: "",
  message: "",
};

export function ConventionRequestModal({ isOpen, onClose }: ConventionRequestModalProps) {
  const t = useTranslations("entreprises.conventionForm");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  // Anti-bot : champ piège invisible + horodatage d'ouverture du formulaire
  // (voir src/lib/security/publicFormGuard.ts)
  const [companyWebsite, setCompanyWebsite] = useState("");
  const formStartedAtRef = useRef(Date.now());
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    formStartedAtRef.current = Date.now();
    firstFieldRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetchPublicApi("/api/convention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyType: formData.companyType,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          monthlyVolume: formData.monthlyVolume || undefined,
          message: formData.message || undefined,
          companyWebsite,
          formStartedAt: formStartedAtRef.current,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "request_failed");

      setSubmitStatus("success");
      setFormData(EMPTY_FORM);
      formStartedAtRef.current = Date.now();
    } catch (error) {
      console.error("Erreur envoi demande de convention:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitStatus("idle");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} aria-hidden="true" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="convention-modal-title"
          className="relative w-full max-w-xl rounded-lg bg-white border border-[#e2dacd] shadow-xl"
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("close")}
            className="absolute top-4 right-4 w-9 h-9 rounded border border-[#e2dacd] flex items-center justify-center text-text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            <X size={16} weight="bold" />
          </button>

          <div className="p-7 md:p-9">
            {submitStatus === "success" ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="text-accent w-7 h-7" weight="regular" />
                </div>
                <h2 id="convention-modal-title" className="text-2xl font-semibold text-foreground mb-2">
                  {t("success.title")}
                </h2>
                <p className="text-text-muted leading-relaxed max-w-md mx-auto">
                  {t("success.desc")}
                </p>
                <Button variant="primary" size="lg" className="mt-7" onClick={handleClose}>
                  {t("close")}
                </Button>
              </div>
            ) : (
              <>
                <h2
                  id="convention-modal-title"
                  className="font-bold text-2xl md:text-[26px] leading-tight text-foreground tracking-tight pr-10"
                >
                  {t("title")}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[#3d3a35]">{t("subtitle")}</p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  {/* Honeypot : invisible pour un visiteur, rempli par les robots */}
                  <div aria-hidden="true" className="absolute w-px h-px -left-[9999px] overflow-hidden">
                    <label htmlFor="convention-company-website">Site web de votre societe</label>
                    <input
                      id="convention-company-website"
                      name="companyWebsite"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="companyName" className={labelClass}>
                        {t("companyName")} *
                      </label>
                      <input
                        ref={firstFieldRef}
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        maxLength={160}
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder={t("companyNamePlaceholder")}
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="companyType" className={labelClass}>
                        {t("companyType")} *
                      </label>
                      <select
                        id="companyType"
                        name="companyType"
                        required
                        value={formData.companyType}
                        onChange={handleChange}
                        className={`${fieldClass} appearance-none cursor-pointer`}
                      >
                        <option value="">{t("companyTypePlaceholder")}</option>
                        {COMPANY_TYPES.map((type) => (
                          <option key={type} value={type}>{t(`companyTypes.${type}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="contactName" className={labelClass}>
                        {t("contactName")} *
                      </label>
                      <input
                        id="contactName"
                        name="contactName"
                        type="text"
                        required
                        maxLength={120}
                        value={formData.contactName}
                        onChange={handleChange}
                        placeholder={t("contactNamePlaceholder")}
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="contactEmail" className={labelClass}>
                        {t("contactEmail")} *
                      </label>
                      <input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        required
                        maxLength={180}
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder={t("contactEmailPlaceholder")}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="contactPhone" className={labelClass}>
                        {t("contactPhone")} *
                      </label>
                      <input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        required
                        maxLength={30}
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+221 ..."
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="monthlyVolume" className={labelClass}>
                        {t("monthlyVolume")}
                      </label>
                      <select
                        id="monthlyVolume"
                        name="monthlyVolume"
                        value={formData.monthlyVolume}
                        onChange={handleChange}
                        className={`${fieldClass} appearance-none cursor-pointer`}
                      >
                        <option value="">{t("monthlyVolumePlaceholder")}</option>
                        {MONTHLY_VOLUMES.map((volume) => (
                          <option key={volume} value={volume}>{t(`volumes.${volume}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="convention-message" className={labelClass}>
                      {t("message")}
                    </label>
                    <textarea
                      id="convention-message"
                      name="message"
                      rows={3}
                      maxLength={2000}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("messagePlaceholder")}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                    <Button type="button" variant="outline" size="lg" onClick={handleClose}>
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      icon={<CaretRight size={18} weight="bold" />}
                      iconPosition="right"
                    >
                      {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                  </div>

                  {submitStatus === "error" && (
                    <p className="text-center text-error text-xs font-medium">{t("error")}</p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
