"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  User,
  CheckCircle,
  ArrowLeft,
  CaretRight,
  Stack
} from "@phosphor-icons/react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/Button";

// Données des marques et modèles (conservées de l'original)
const vehicleData = {
  Mercedes: [
    "Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "Classe G",
    "GLA", "GLB", "GLC", "GLE", "GLS", "CLA", "CLS", "SL", "AMG GT"
  ],
  Mitsubishi: [
    "Outlander", "ASX RVR", "ASR Outlander Sport", "Eclipse Cross", "Colt", "Space Star",
    "Mirage G4", "Pajero Sport", "Lancer ", "Pajero", "Lancer Evolution", "Galant", "3000 GT", "i-MiEV"
  ],
  BMW: [
    "Série 1", "Série 2", "Série 3", "Série 5", "Série 7", "Série 8",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "iX"
  ],
  Audi: [
    "A1", "A3", "A4", "A6", "A8", "Q2", "Q3", "Q5", "Q7", "Q8",
    "TT", "R8", "e-tron GT", "e-tron"
  ],
  Volkswagen: [
    "Polo", "Golf", "Passat", "Arteon", "Tiguan", "Touareg", "T-Cross",
    "T-Roc", "Sharan", "Touran"
  ],
  Renault: [
    "Clio", "Megane", "Scenic", "Kadjar", "Koleos", "Captur", "Arkana",
    "Talisman", "Espace"
  ],
  Peugeot: [
    "208", "308", "508", "2008", "3008", "5008", "Partner", "Rifter", "Traveller"
  ],
  Citroën: [
    "C1", "C3", "C4", "C5", "C3 Aircross", "C4 Aircross", "C5 Aircross",
    "Berlingo", "SpaceTourer"
  ],
  Tesla: [
    "Model 3", "Model S", "Model X", "Model Y"
  ],
  Ford: [
    "Fiesta", "Focus", "Mondeo", "Mustang", "EcoSport", "Kuga", "Edge",
    "Explorer", "Ranger", "Transit", "Puma", "Bronco"
  ],
  Hyundai: [
    "i10", "i20", "i30", "Elantra", "Sonata", "Tucson", "Santa Fe",
    "Kona", "Ioniq", "Nexo", "Bayon", "Staria"
  ],
  Toyota: [
    "Yaris", "Corolla", "Camry", "Prius", "Auris", "Avensis", "RAV4",
    "Highlander", "Land Cruiser", "C-HR", "Aygo", "Proace"
  ],
  Dacia: [
    "Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring",
    "Jogger", "Bigster"
  ],
  Nissan: [
    "Micra", "Note", "Sentra", "Altima", "Maxima", "Juke", "Qashqai",
    "X-Trail", "Murano", "Pathfinder", "Leaf", "Ariya"
  ],
  Skoda: [
    "Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq",
    "Enyaq", "Citigo", "Rapid"
  ],
  Opel: [
    "Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland",
    "Combo", "Vivaro", "Movano", "Ampera-e"
  ],
  Fiat: [
    "500", "Panda", "Punto", "Tipo", "Bravo", "500X", "500L",
    "Ducato", "Doblo", "Fiorino"
  ],
  Seat: [
    "Ibiza", "Leon", "Toledo", "Arona", "Ateca", "Tarraco",
    "Alhambra", "Mii", "Altea"
  ],
  Cupra: [
    "Formentor", "Leon", "Ateca", "Tavascan", "Born", "UrbanRebel"
  ],
  BYD: [
    "Dolphin", "Seal", "Tang", "Han", "Song", "Qin", "Yuan", "Atto 3"
  ],
  Alpine: [
    "A110", "A290", "A390", "A4810"
  ],
  Abarth: [
    "500", "595", "695", "124 Spider", "Punto"
  ],
  "Alfa Romeo": [
    "Giulia", "Stelvio", "Tonale", "4C", "Giulietta", "159", "Brera"
  ],
  Smart: [
    "Fortwo", "Forfour", "EQfortwo", "EQforfour", "Roadster"
  ],
  Mini: [
    "Cooper", "Clubman", "Countryman", "Paceman", "Roadster",
    "Coupe", "Electric"
  ],
  Mazda: [
    "2", "3", "6", "CX-3", "CX-5", "CX-7", "CX-9", "MX-5",
    "RX-8", "CX-30"
  ],
  Suzuki: [
    "Swift", "Baleno", "Vitara", "S-Cross", "Jimny", "Ignis",
    "Celerio", "Alto", "Grand Vitara"
  ],
  Honda: [
    "Civic", "Accord", "Jazz", "CR-V", "HR-V", "Pilot", "Ridgeline",
    "Insight", "Fit", "Odyssey"
  ],
  Lexus: [
    "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC", "RC"
  ],
  Subaru: [
    "Impreza", "Legacy", "Outback", "Forester", "Ascent", "WRX",
    "BRZ", "Crosstrek", "Tribeca"
  ],
  Daihatsu: [
    "Sirion", "Terios", "Copen", "Move", "Tanto", "Rocky", "Taft"
  ],
  Volvo: [
    "XC40", "XC60", "XC90", "V40", "V60", "V90", "S60", "S90",
    "C40", "EX30"
  ]
};

// Générer les années de 2002 à l'année actuelle
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2001 }, (_, i) => currentYear - i);

const monoLabel = "font-[family-name:var(--font-ibm-plex-mono)]";

const beneficesList = [
  {
    label: "VOLUME",
    text: "Entre 12 et 20 courses par semaine selon la disponibilité que vous déclarez. Le planning part le vendredi pour la semaine suivante."
  },
  {
    label: "TARIF",
    text: "Le montant de chaque course est connu avant que vous l'acceptiez. Pas d'enchère, pas de course à l'aveugle, pas de tarif révisé après coup."
  },
  {
    label: "LITIGES",
    text: "Un interlocuteur humain, joignable, et une procédure écrite en cas de désaccord avec un client. Vous n'êtes pas seul face à une application."
  },
  {
    label: "CARBURANT",
    text: "Péage et carburant remboursés au réel sur les courses longues, sur présentation du ticket."
  }
];

const conditionsSpec = [
  { label: "COMMISSION", value: "15 % FIXE" },
  { label: "DÉLAI DE PAIEMENT", value: "7 JOURS" },
  { label: "FRAIS D'ENTRÉE", value: "AUCUN" },
  { label: "VÉHICULE", value: "MOINS DE 8 ANS" },
  { label: "ÉQUIPEMENT", value: "CLIM. OBLIGATOIRE" },
  { label: "PERMIS", value: "B, 3 ANS MINIMUM" },
  { label: "ASSURANCE", value: "TRANSPORT DE PERS." },
  { label: "ZONE", value: "CORRIDOR DKR–MBR" }
];

const etapes = [
  {
    titre: "Vous vous présentez",
    texte: "Identité, véhicule et disponibilités. Le formulaire se remplit en quelques minutes."
  },
  {
    titre: "On vous rappelle",
    texte: "Sous 48 heures ouvrées. Nous répondons à tout le monde, même quand c'est non."
  },
  {
    titre: "On se voit",
    texte: "Rencontre à Dakar ou Mbour, vérification des papiers et état du véhicule."
  },
  {
    titre: "Première course",
    texte: "Course accompagnée sur un segment court, puis entrée dans le planning."
  }
];

export default function DevenirPartenaireClient() {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    experience: "",
    vehicule: {
      marque: "",
      modele: "",
      annee: "",
      immatriculation: "",
      assurance: false,
      permis: false
    },
    motivation: "",
    disponibilite: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

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
          vehicule: {
            ...prev.vehicule,
            [vehiculeField]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  // Progression purement visuelle (n'affecte ni la validation, ni les données envoyées)
  const requiredStrings = [
    formData.prenom, formData.nom, formData.email, formData.telephone, formData.experience,
    formData.vehicule.marque, formData.vehicule.modele, formData.vehicule.annee, formData.vehicule.immatriculation,
    formData.disponibilite, formData.motivation
  ];
  const requiredBooleans = [formData.vehicule.assurance, formData.vehicule.permis];
  const totalRequired = requiredStrings.length + requiredBooleans.length;
  const filledCount =
    requiredStrings.filter((v) => v.trim().length > 0).length +
    requiredBooleans.filter(Boolean).length;
  const progressSegments = 6;
  const filledSegments = Math.round((filledCount / totalRequired) * progressSegments);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Navigation />
        <AnimatePresence mode="wait">
          <SuccessState key="success" />
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
              Chauffeurs &amp; propriétaires de véhicules
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-[1.08]">
              Vous connaissez la route. Nous avons les passagers.
            </h1>
            <p className="text-base text-[#3d3a35] leading-relaxed max-w-md">
              Nous travaillons avec un nombre limité de chauffeurs sur le corridor. Courses régulières,
              tarifs connus avant acceptation, paiement sous sept jours. Douze places ouvertes pour 2026.
            </p>
            <div className="pt-2">
              <a
                href="#conditions"
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded px-6 py-3.5 text-base transition-colors"
              >
                Lire les conditions
                <CaretRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative min-h-[320px] lg:min-h-[440px] rounded-lg overflow-hidden border border-[#e2dacd] flex items-end p-5"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #E8DCC8 0 10px, #E0D2B9 10px 20px)"
            }}
          >
            <span className={`${monoLabel} text-[11px] uppercase tracking-wide text-[#6b6154] bg-background px-3 py-2 rounded`}>
              Photo — chauffeur partenaire, aire d&apos;attente AIBD
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-b border-[#e2dacd]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e2dacd]">
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">7 j</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              Délai de paiement après la course. Virement, Wave ou Orange Money.
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">15 %</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              Commission fixe, annoncée avant la première course. Aucun frais d&apos;inscription.
            </p>
          </div>
          <div className="px-6 sm:px-10 py-10 flex flex-col gap-2.5">
            <div className="text-4xl font-bold text-gold tracking-tight">1 axe</div>
            <p className="text-sm text-[#3d3a35] leading-relaxed">
              Vous restez sur le corridor que vous connaissez, pas envoyé au hasard dans Dakar.
            </p>
          </div>
        </div>
      </section>

      {/* ── CE QUE LA PLACE VOUS APPORTE + CONDITIONS ── */}
      <section id="conditions" className="border-b border-[#e2dacd] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-[1fr_420px] gap-12">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight">
              Ce que la place vous apporte
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
              Conditions partenaire — 2026
            </p>
            <div className="h-px bg-[#2e2b27]" />
            <dl className={`${monoLabel} flex flex-col gap-3 text-xs text-[#9a938a]`}>
              {conditionsSpec.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-4">
                  <dt>{spec.label}</dt>
                  <dd className="text-background">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <div className="h-px bg-[#2e2b27]" />
            <div className="flex items-baseline justify-between">
              <span className={`${monoLabel} text-xs text-[#9a938a]`}>Places ouvertes</span>
              <span className="text-3xl font-bold text-gold tracking-tight">12</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ON AVANCE ── */}
      <section id="comment-ca-marche" className="border-b border-[#e2dacd] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl sm:text-[34px] font-bold text-foreground tracking-tight mb-10">
            Comment on avance
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {etapes.map((etape, idx) => (
              <div key={etape.titre} className="pt-4 border-t-2 border-foreground flex flex-col gap-2.5">
                <p className={`${monoLabel} text-[11px] uppercase tracking-[0.14em] text-text-muted`}>
                  Étape 0{idx + 1}
                </p>
                <h3 className="text-[17px] font-semibold text-foreground">{etape.titre}</h3>
                <p className="text-sm text-[#3d3a35] leading-relaxed">{etape.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CANDIDATURE (formulaire, en bas de page) ── */}
      <section id="candidature" className="bg-[#E8DCC8] scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-[1fr_480px] gap-12">
          <div className="flex flex-col gap-5">
            <p className={`${monoLabel} text-[11px] uppercase tracking-[0.16em] text-accent`}>Candidature</p>
            <h2 className="text-3xl sm:text-[38px] font-bold text-foreground tracking-tight leading-tight">
              Les conditions vous conviennent ?
            </h2>
            <p className="text-base text-[#3d3a35] leading-relaxed max-w-md">
              Remplissez votre dossier ci-contre. Aucune pièce à téléverser à ce stade : les papiers,
              on les regarde ensemble le jour du rendez-vous.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3.5 items-baseline">
                <div className={`${monoLabel} text-[11px] text-gold w-14 shrink-0`}>48 H</div>
                <p className="text-sm text-[#3d3a35]">Délai de réponse, quelle qu&apos;elle soit.</p>
              </div>
              <div className="flex gap-3.5 items-baseline">
                <div className={`${monoLabel} text-[11px] text-gold w-14 shrink-0`}>0 F</div>
                <p className="text-sm text-[#3d3a35]">Aucun frais de dossier, à aucun moment.</p>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-[#d8d2c7] rounded-lg p-7 flex flex-col gap-7"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-foreground">Dossier de candidature</h3>
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
              {/* SECTION 1: IDENTITÉ */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e2dacd]">
                  <User size={16} className="text-accent" />
                  <h4 className={`${monoLabel} text-foreground text-xs uppercase tracking-[0.14em]`}>Votre identité</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Prénom"
                    name="prenom"
                    placeholder="Ex : Amadou"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    required
                  />
                  <FormInput
                    label="Nom"
                    name="nom"
                    placeholder="Ex : Fall"
                    value={formData.nom}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="amadou@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <FormInput
                    label="Téléphone / WhatsApp"
                    name="telephone"
                    type="tel"
                    placeholder="+221 XX XXX XX XX"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <PillRadioGroup
                  label="Expérience de conduite"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  options={[
                    { value: "1-3", label: "1 à 3 ans" },
                    { value: "4-6", label: "4 à 6 ans" },
                    { value: "7-10", label: "7 à 10 ans" },
                    { value: "10+", label: "Plus de 10 ans" },
                  ]}
                />
              </div>

              {/* SECTION 2: VÉHICULE */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e2dacd]">
                  <Car size={16} className="text-accent" />
                  <h4 className={`${monoLabel} text-foreground text-xs uppercase tracking-[0.14em]`}>Votre véhicule</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormSelect
                    label="Marque"
                    name="vehicule.marque"
                    value={formData.vehicule.marque}
                    onChange={handleInputChange}
                    required
                    options={Object.keys(vehicleData).map(m => ({ value: m, label: m }))}
                  />
                  <FormSelect
                    label="Modèle"
                    name="vehicule.modele"
                    value={formData.vehicule.modele}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.vehicule.marque}
                    options={formData.vehicule.marque ? (vehicleData as Record<string, string[]>)[formData.vehicule.marque].map((m: string) => ({ value: m, label: m })) : []}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormSelect
                    label="Année"
                    name="vehicule.annee"
                    value={formData.vehicule.annee}
                    onChange={handleInputChange}
                    required
                    options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                  />
                  <FormInput
                    label="Immatriculation"
                    name="vehicule.immatriculation"
                    placeholder="Ex : AA-123-BB"
                    value={formData.vehicule.immatriculation}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <FormCheckbox
                    name="vehicule.assurance"
                    checked={formData.vehicule.assurance}
                    onChange={handleInputChange}
                    label="Je certifie posséder une assurance valide"
                  />
                  <FormCheckbox
                    name="vehicule.permis"
                    checked={formData.vehicule.permis}
                    onChange={handleInputChange}
                    label="Mon permis de conduire est valide (plus de 3 ans)"
                  />
                </div>
              </div>

              {/* SECTION 3: MOTIVATION & DISPONIBILITÉ */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#e2dacd]">
                  <Stack size={16} className="text-accent" />
                  <h4 className={`${monoLabel} text-foreground text-xs uppercase tracking-[0.14em]`}>Motivation &amp; disponibilité</h4>
                </div>

                <div className="flex flex-col gap-2">
                  <PillRadioGroup
                    label="Profil de disponibilité"
                    name="disponibilite"
                    value={formData.disponibilite}
                    onChange={handleInputChange}
                    required
                    options={[
                      { value: "temps-plein", label: "Temps plein" },
                      { value: "temps-partiel", label: "Temps partiel" },
                      { value: "weekend", label: "Week-ends" },
                      { value: "soiree", label: "Soirées" },
                      { value: "ponctuel", label: "Ponctuel" },
                    ]}
                  />
                  <p className="text-[11px] text-text-muted italic px-0.5">
                    Les demandes vous seront assignées en fonction des créneaux déclarés.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>
                    Vos motivations *
                  </label>
                  <textarea
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Parlez-nous de vous et de pourquoi vous souhaitez nous rejoindre..."
                    className="w-full bg-background border border-[#d8d2c7] rounded p-4 text-foreground text-sm outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
              </div>

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
                  {isSubmitting ? "Traitement de votre dossier..." : "Envoyer ma candidature"}
                </Button>
                <p className={`${monoLabel} text-center text-text-muted text-[11px] uppercase tracking-[0.1em]`}>
                  Réponse sous 48 h · Aucun frais de dossier
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

function FormSelect({ label, name, value, onChange, options, required = false, disabled = false }: {
  label: string;
  name: string;
  value: string;
  onChange: FormFieldChangeHandler;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
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
        <option value="">Choisir...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormCheckbox({ name, checked, onChange, label }: {
  name: string;
  checked: boolean;
  onChange: FormFieldChangeHandler;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="w-5 h-5 border border-[#d8d2c7] rounded bg-background peer-checked:bg-accent peer-checked:border-accent transition-colors" />
        <CheckCircle size={12} weight="bold" className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
      <span className="text-[#3d3a35] text-sm group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );
}

function PillRadioGroup({ label, name, value, onChange, options, required = false }: {
  label: string;
  name: string;
  value: string;
  onChange: FormFieldChangeHandler;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>
        {label} {required && "*"}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`cursor-pointer rounded px-4 py-2.5 text-sm font-medium border transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-[#c9c3b8] text-[#3d3a35] hover:border-foreground/40"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isActive}
                onChange={onChange}
                required={required}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function SuccessState() {
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
        Candidature reçue
      </h1>
      <p className="max-w-[460px] text-[#3d3a35] mb-10 text-base leading-relaxed">
        Merci de votre intérêt pour Navette Xpress. Notre équipe partenaires va analyser votre dossier.{" "}
        <span className="text-foreground font-medium">Vous recevrez une réponse sous 48 h.</span>
      </p>

      <Link href="/">
        <span className="inline-flex items-center gap-2 border border-foreground text-foreground hover:bg-foreground hover:text-background rounded px-8 py-3.5 font-semibold transition-colors">
          <ArrowLeft size={18} />
          Retour à l&apos;accueil
        </span>
      </Link>
    </motion.div>
  );
}
