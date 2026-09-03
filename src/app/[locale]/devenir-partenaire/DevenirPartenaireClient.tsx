"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  User,
  CheckCircle,
  ArrowLeft,
  CaretRight,
  WarningCircle
} from "@phosphor-icons/react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/Button";

// Données des marques et modèles, triées par ordre alphabétique
const vehicleData = {
  Abarth: [
    "500", "595", "695", "124 Spider", "Punto"
  ],
  "Alfa Romeo": [
    "Giulia", "Stelvio", "Tonale", "4C", "Giulietta", "159", "Brera"
  ],
  Alpine: [
    "A110", "A290", "A390", "A4810"
  ],
  Audi: [
    "A1", "A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8",
    "TT", "R8", "e-tron GT", "e-tron"
  ],
  BMW: [
    "Série 1", "Série 2", "Série 3", "Série 5", "Série 7", "Série 8",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"
  ],
  BYD: [
    "Dolphin", "Seal", "Tang", "Han", "Song", "Qin", "Yuan", "Atto 3"
  ],
  Cadillac: [
    "Escalade", "XT4", "XT5", "XT6", "CT5"
  ],
  Changan: [
    "CS35", "CS55", "CS75", "Alsvin"
  ],
  Chery: [
    "Tiggo 2", "Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo"
  ],
  Chevrolet: [
    "Spark", "Aveo", "Cruze", "Malibu", "Camaro", "Trailblazer",
    "Captiva", "Equinox", "Tahoe", "Silverado"
  ],
  Chrysler: [
    "300", "Pacifica", "Voyager"
  ],
  Citroën: [
    "C1", "C3", "C4", "C5", "C3 Aircross", "C4 Aircross", "C5 Aircross",
    "Berlingo", "SpaceTourer"
  ],
  Cupra: [
    "Formentor", "Leon", "Ateca", "Tavascan", "Born", "UrbanRebel"
  ],
  Dacia: [
    "Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring",
    "Jogger", "Bigster"
  ],
  Daihatsu: [
    "Sirion", "Terios", "Copen", "Move", "Tanto", "Rocky", "Taft"
  ],
  Datsun: [
    "GO", "GO+", "redi-GO"
  ],
  DFSK: [
    "Glory 580", "K01", "C31"
  ],
  Dodge: [
    "Charger", "Challenger", "Journey", "Durango", "Ram"
  ],
  Fiat: [
    "500", "Panda", "Punto", "Tipo", "Bravo", "500X", "500L",
    "Ducato", "Doblo", "Fiorino"
  ],
  Ford: [
    "Fiesta", "Focus", "Mondeo", "Mustang", "EcoSport", "Kuga", "Edge",
    "Explorer", "Ranger", "Transit", "Puma", "Bronco"
  ],
  Geely: [
    "Coolray", "Emgrand", "Azkarra", "Tugella", "Okavango"
  ],
  Genesis: [
    "G70", "G80", "G90", "GV70", "GV80"
  ],
  GMC: [
    "Sierra", "Yukon", "Acadia", "Terrain"
  ],
  Haval: [
    "H6", "Jolion", "H9", "Dargo"
  ],
  Honda: [
    "Civic", "Accord", "Jazz", "CR-V", "HR-V", "Pilot", "Ridgeline",
    "Insight", "Fit", "Odyssey"
  ],
  Hyundai: [
    "i10", "i20", "i30", "Elantra", "Sonata", "Tucson", "Santa Fe",
    "Kona", "Ioniq", "Nexo", "Bayon", "Staria"
  ],
  Infiniti: [
    "Q50", "Q60", "QX50", "QX60", "QX80"
  ],
  Isuzu: [
    "D-Max", "MU-X", "Trooper"
  ],
  JAC: [
    "J7", "JS4", "S3", "T6"
  ],
  Jeep: [
    "Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator"
  ],
  Kia: [
    "Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Seltos",
    "Stonic", "Soul", "Optima", "Carnival", "EV6"
  ],
  Lexus: [
    "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC", "RC"
  ],
  Mazda: [
    "2", "3", "6", "CX-3", "CX-5", "CX-7", "CX-9", "MX-5",
    "RX-8", "CX-30"
  ],
  Mercedes: [
    "Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "Classe G",
    "GLA", "GLB", "GLC", "GLE", "GLS", "CLA", "CLS", "SL", "AMG GT"
  ],
  MG: [
    "MG3", "MG5", "ZS", "HS", "RX5"
  ],
  Mini: [
    "Cooper", "Clubman", "Countryman", "Paceman", "Roadster",
    "Coupe", "Electric"
  ],
  Mitsubishi: [
    "Outlander", "ASX RVR", "ASR Outlander Sport", "Eclipse Cross", "Colt", "Space Star",
    "Mirage G4", "Pajero Sport", "Lancer ", "Pajero", "Lancer Evolution", "Galant", "3000 GT", "i-MiEV"
  ],
  Nissan: [
    "Micra", "Note", "Sentra", "Altima", "Maxima", "Juke", "Qashqai",
    "X-Trail", "Murano", "Pathfinder", "Leaf", "Ariya"
  ],
  Opel: [
    "Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland",
    "Combo", "Vivaro", "Movano", "Ampera-e"
  ],
  Peugeot: [
    "208", "308", "508", "2008", "3008", "5008", "Partner", "Rifter", "Traveller"
  ],
  Renault: [
    "Clio", "Megane", "Scenic", "Kadjar", "Koleos", "Captur", "Arkana",
    "Talisman", "Espace"
  ],
  Seat: [
    "Ibiza", "Leon", "Toledo", "Arona", "Ateca", "Tarraco",
    "Alhambra", "Mii", "Altea"
  ],
  Skoda: [
    "Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq",
    "Enyaq", "Citigo", "Rapid"
  ],
  Smart: [
    "Fortwo", "Forfour", "EQfortwo", "EQforfour", "Roadster"
  ],
  SsangYong: [
    "Tivoli", "Korando", "Rexton", "Musso", "Actyon"
  ],
  Subaru: [
    "Impreza", "Legacy", "Outback", "Forester", "Ascent", "WRX",
    "BRZ", "Crosstrek", "Tribeca"
  ],
  Suzuki: [
    "Swift", "Baleno", "Vitara", "S-Cross", "Jimny", "Ignis",
    "Celerio", "Alto", "Grand Vitara"
  ],
  Tesla: [
    "Model 3", "Model S", "Model X", "Model Y"
  ],
  Toyota: [
    "Yaris", "Corolla", "Camry", "Prius", "Auris", "Avensis", "RAV4",
    "Highlander", "Land Cruiser", "C-HR", "Aygo", "Proace"
  ],
  Volkswagen: [
    "Polo", "Golf", "Passat", "Arteon", "Tiguan", "Touareg", "T-Cross",
    "T-Roc", "Sharan", "Touran"
  ],
  Volvo: [
    "XC40", "XC60", "XC90", "V40", "V60", "V90", "S60", "S90",
    "C40", "EX30"
  ]
};

const monoLabel = "font-[family-name:var(--font-ibm-plex-mono)]";

export default function DevenirPartenaireClient() {
  const t = useTranslations("devenir-partenaire");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    telephone: "",
    vehicule: {
      marque: "",
      modele: "",
      immatriculation: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const beneficesList = t.raw("benefits.items") as { label: string; text: string }[];
  const conditionsSpec = t.raw("conditions.items") as { label: string; value: string; note?: string }[];
  const etapes = t.raw("steps.items") as { title: string; text: string }[];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.startsWith("vehicule.")) {
      const vehiculeField = name.split(".")[1];

      if (vehiculeField === "marque") {
        setFormData(prev => ({
          ...prev,
          vehicule: {
            ...prev.vehicule,
            marque: value,
            modele: ""
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          vehicule: { ...prev.vehicule, [vehiculeField]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/driver-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.telephone,
          vehicleBrand: formData.vehicule.marque,
          vehicleModel: formData.vehicule.modele,
          vehiclePlateNumber: formData.vehicule.immatriculation,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else if (response.status === 400 && /email/i.test(result.error || "")) {
        setErrorMessage(t("form.errorEmailExists"));
      } else {
        setErrorMessage(t("form.errorGeneric"));
      }
    } catch {
      setErrorMessage(t("form.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progression purement visuelle (n'affecte ni la validation, ni les données envoyées)
  const requiredStrings = [
    formData.fullName, formData.email, formData.telephone,
    formData.vehicule.marque, formData.vehicule.modele, formData.vehicule.immatriculation,
  ];
  const totalRequired = requiredStrings.length;
  const filledCount = requiredStrings.filter((v) => v.trim().length > 0).length;
  const progressSegments = totalRequired;
  const filledSegments = filledCount;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navigation />
        <AnimatePresence mode="wait">
          <SuccessState key="success" t={t} />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />

      {/* ── HERO ── */}
      <section className="pt-40 pb-16 border-b border-[#e2dacd]">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            <p className={`${monoLabel} text-[11px] uppercase tracking-[0.16em] text-accent`}>
              {t("hero.eyebrow")}
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.08]">
              {t("hero.title")}
            </h1>
            <p className="text-base text-[#3d3a35] leading-relaxed max-w-md">
              {t("hero.subtitle")}
            </p>
            <div className="pt-2">
              <a
                href="#conditions"
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded px-6 py-3.5 text-base transition-colors"
              >
                {t("hero.cta")}
                <CaretRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative min-h-[320px] lg:min-h-[440px] rounded-lg overflow-hidden border border-[#e2dacd]"
          >
            <Image
              src="/images/devenir-partenaire-chauffeur.jpg"
              alt={t("hero.imageAlt")}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-b border-[#e2dacd]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e2dacd]">
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">{t("stats.payment.value")}</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              {t("stats.payment.text")}
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">{t("stats.commission.value")}</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              {t("stats.commission.text")}
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">{t("stats.corridor.value")}</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              {t("stats.corridor.text")}
            </p>
          </div>
        </div>
      </section>

      {/* ── CE QUE LA PLACE VOUS APPORTE + CONDITIONS ── */}
      <section id="conditions" className="border-b border-[#e2dacd] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-[1fr_420px] gap-12">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight">
              {t("benefits.title")}
            </h2>
            <div className="flex flex-col divide-y divide-[#e2dacd] border-t border-[#e2dacd]">
              {beneficesList.map((item) => (
                <div key={item.label} className="flex flex-col sm:flex-row gap-2 sm:gap-6 py-5">
                  <div className={`${monoLabel} text-[11px] uppercase tracking-[0.14em] text-text-muted sm:w-28 shrink-0`}>
                    {item.label}
                  </div>
                  <p className="text-[15px] text-[#3d3a35] leading-relaxed flex-1">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#12100E] rounded-lg p-7 flex flex-col gap-4 self-start">
            <p className={`${monoLabel} text-[11px] uppercase tracking-[0.16em] text-[#9a938a]`}>
              {t("conditions.eyebrow")}
            </p>
            <div className="h-px bg-[#2e2b27]" />
            <dl className={`${monoLabel} flex flex-col gap-3 text-xs text-[#9a938a]`}>
              {conditionsSpec.map((spec) => (
                <div key={spec.label} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-4">
                    <dt>{spec.label}</dt>
                    <dd className="text-background">{spec.value}</dd>
                  </div>
                  {spec.note && (
                    <p className="normal-case tracking-normal text-[11px] leading-snug text-[#6f695f]">
                      {spec.note}
                    </p>
                  )}
                </div>
              ))}
            </dl>
            <div className="h-px bg-[#2e2b27]" />
            <div className="flex items-baseline justify-between">
              <span className={`${monoLabel} text-xs text-[#9a938a]`}>{t("conditions.openSpots")}</span>
              <span className="text-3xl font-bold text-gold tracking-tight">{t("conditions.openSpotsValue")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ON AVANCE ── */}
      <section id="comment-ca-marche" className="border-b border-[#e2dacd] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight mb-10">
            {t("steps.title")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {etapes.map((etape, idx) => (
              <div key={etape.title} className="pt-4 border-t-2 border-foreground flex flex-col gap-2.5">
                <p className={`${monoLabel} text-[11px] uppercase tracking-[0.14em] text-text-muted`}>
                  {t("steps.stepLabel")} 0{idx + 1}
                </p>
                <h3 className="text-[17px] font-semibold text-foreground">{etape.title}</h3>
                <p className="text-sm text-[#3d3a35] leading-relaxed">{etape.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANDIDATURE (formulaire, en bas de page) ── */}
      <section id="candidature" className="bg-[#E8DCC8] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-[1fr_480px] gap-12">
          <div className="flex flex-col gap-5">
            <p className={`${monoLabel} text-[11px] uppercase tracking-[0.16em] text-accent`}>{t("application.eyebrow")}</p>
            <h2 className="text-3xl sm:text-[38px] font-bold text-foreground tracking-tight leading-tight">
              {t("application.title")}
            </h2>
            <p className="text-base text-[#3d3a35] leading-relaxed max-w-md">
              {t("application.desc")}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3.5 items-baseline">
                <div className={`${monoLabel} text-[11px] text-gold w-14 shrink-0`}>{t("application.perk1.value")}</div>
                <p className="text-sm text-[#3d3a35]">{t("application.perk1.text")}</p>
              </div>
              <div className="flex gap-3.5 items-baseline">
                <div className={`${monoLabel} text-[11px] text-gold w-14 shrink-0`}>{t("application.perk2.value")}</div>
                <p className="text-sm text-[#3d3a35]">{t("application.perk2.text")}</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-[#d8d2c7] rounded-lg p-7 flex flex-col gap-7"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-foreground">{t("form.title")}</h3>
              <span className={`${monoLabel} text-[11px] text-text-muted`}>{filledCount} / {totalRequired}</span>
            </div>
            <div className="flex gap-1.5 -mt-4">
              {Array.from({ length: progressSegments }).map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-full ${i < filledSegments ? "bg-accent" : "bg-[#dcd4c6]"}`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* SECTION 1: COORDONNÉES */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e2dacd]">
                  <User size={16} className="text-accent" />
                  <h4 className={`${monoLabel} text-foreground text-xs uppercase tracking-[0.14em]`}>{t("form.sections.identity")}</h4>
                </div>

                <FormInput
                  label={t("form.fields.fullName.label")}
                  name="fullName"
                  placeholder={t("form.fields.fullName.placeholder")}
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label={t("form.fields.email.label")}
                    name="email"
                    type="email"
                    placeholder={t("form.fields.email.placeholder")}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <FormInput
                    label={t("form.fields.phone.label")}
                    name="telephone"
                    type="tel"
                    placeholder={t("form.fields.phone.placeholder")}
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* SECTION 2: VÉHICULE */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e2dacd]">
                  <Car size={16} className="text-accent" />
                  <h4 className={`${monoLabel} text-foreground text-xs uppercase tracking-[0.14em]`}>{t("form.sections.vehicle")}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormBrandCombobox
                    label={t("form.fields.brand.label")}
                    name="vehicule.marque"
                    value={formData.vehicule.marque}
                    onChange={handleInputChange}
                    required
                    options={Object.keys(vehicleData).map(m => ({ value: m, label: m }))}
                    selectPlaceholder={t("form.selectPlaceholder")}
                    noResultsLabel={t("form.selectNoResults")}
                  />
                  <FormSelect
                    label={t("form.fields.model.label")}
                    name="vehicule.modele"
                    value={formData.vehicule.modele}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.vehicule.marque}
                    options={formData.vehicule.marque ? (vehicleData as Record<string, string[]>)[formData.vehicule.marque].map((m: string) => ({ value: m, label: m })) : []}
                    selectPlaceholder={t("form.selectPlaceholder")}
                  />
                </div>

                <FormInput
                  label={t("form.fields.plate.label")}
                  name="vehicule.immatriculation"
                  placeholder={t("form.fields.plate.placeholder")}
                  value={formData.vehicule.immatriculation}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-4">
                  <WarningCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* SUBMIT */}
              <div className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  icon={<CaretRight size={20} />}
                  iconPosition="right"
                >
                  {isSubmitting ? t("form.submitting") : t("form.submit")}
                </Button>
                <p className={`${monoLabel} text-center text-text-muted text-[11px] uppercase tracking-[0.1em]`}>
                  {t("form.footnote")}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// ── COMPOSANTS INTERNES ──

interface FormFieldChangeHandler {
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void;
}

function FormInput({ label, name, type = "text", placeholder, value, onChange, required = false }: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: FormFieldChangeHandler;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>
        {label} {required && "*"}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required = false, disabled = false, selectPlaceholder }: {
  label: string;
  name: string;
  value: string;
  onChange: FormFieldChangeHandler;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  selectPlaceholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>
        {label} {required && "*"}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors appearance-none cursor-pointer disabled:opacity-40"
      >
        <option value="">{selectPlaceholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Champ marque : saisie libre pour filtrer la liste plutôt que de scroller un long menu
function FormBrandCombobox({ label, name, value, onChange, options, required = false, selectPlaceholder, noResultsLabel }: {
  label: string;
  name: string;
  value: string;
  onChange: FormFieldChangeHandler;
  options: { value: string; label: string }[];
  required?: boolean;
  selectPlaceholder: string;
  noResultsLabel: string;
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const emitChange = (newValue: string) => {
    onChange({ target: { name, value: newValue } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };

  const handleSelect = (opt: { value: string; label: string }) => {
    emitChange(opt.value);
    setQuery(opt.label);
    setIsOpen(false);
  };

  const handleBlur = () => {
    const match = options.find((opt) => opt.label.toLowerCase() === query.trim().toLowerCase());
    if (match) {
      emitChange(match.value);
      setQuery(match.label);
    } else {
      emitChange("");
      setQuery("");
    }
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>
        {label} {required && "*"}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={selectPlaceholder}
        required={required}
        autoComplete="off"
        className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors"
      />
      {isOpen && (
        <ul className="absolute top-full left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto bg-background border border-[#d8d2c7] rounded shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-accent/10 transition-colors"
                >
                  {opt.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-2.5 text-sm text-text-muted">{noResultsLabel}</li>
          )}
        </ul>
      )}
    </div>
  );
}

function SuccessState({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center"
    >
      <div className="w-20 h-20 bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center mb-8">
        <CheckCircle size={40} weight="bold" className="text-accent" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-6">
        {t("success.title")}
      </h1>
      <p className="max-w-[460px] text-[#3d3a35] mb-10 text-base leading-relaxed">
        {t("success.desc")}{" "}
        <span className="text-foreground font-medium">{t("success.descHighlight")}</span>
      </p>

      <Link href="/">
        <span className="inline-flex items-center gap-2 border border-foreground text-foreground hover:bg-foreground hover:text-background rounded px-8 py-3.5 font-semibold transition-colors">
          <ArrowLeft size={18} />
          {t("success.backHome")}
        </span>
      </Link>
    </motion.div>
  );
}
