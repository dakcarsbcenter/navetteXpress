"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import { EditProfileModal } from "@/components/client/EditProfileModal";
import type { Profile } from "../types";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-[family-name:var(--font-ibm-plex-mono)] tracking-[0.14em] text-[#6E6A63] uppercase mb-1">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export function EntrepriseProfileTab({ profile, onUpdated }: { profile: Profile; onUpdated: () => void }) {
  const t = useTranslations("entreprise.profile");
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div className="bg-white border border-border rounded p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-foreground">{t("title")}</h3>
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-[#12100E]"
        >
          <PencilSimple size={14} /> {t("edit")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={t("fields.name")} value={profile.name} />
        <Field label={t("fields.email")} value={profile.email} />
        <Field label={t("fields.phone")} value={profile.phone} />
        <Field label={t("fields.companyName")} value={profile.companyName} />
        <Field label={t("fields.raisonSociale")} value={profile.raisonSociale} />
        <Field label={t("fields.ninea")} value={profile.ninea} />
        <Field label={t("fields.companyAddress")} value={profile.companyAddress} />
        <Field label={t("fields.bp")} value={profile.bp} />
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={profile}
        onSuccess={() => {
          setIsEditOpen(false);
          onUpdated();
        }}
      />
    </div>
  );
}
