"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  Star
} from "lucide-react";

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

  return (
    <div className="min-h-screen flex bg-background font-sans selection:bg-gold/30 selection:text-gold">
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <SuccessState key="success" />
        ) : (
          <div key="form" className="flex w-full">
            {/* ── PANNEAU GAUCHE DÉCORATIF ── */}
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col bg-surface-1 border-r border-border">
              {/* Orbes flottantes */}
              <div className="orb-float absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-40"
                style={{
                  top: '-15%', left: '-10%',
                  background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                }} />
              <div className="orb-float-delay absolute w-[400px] h-[400px] rounded-full pointer-events-none opacity-30"
                style={{
                  bottom: '10%', right: '-15%',
                  background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                }} />

              {/* Contenu */}
              <div className="relative z-10 flex flex-col h-full px-12 py-12">
                {/* Logo & Back Link */}
                <div className="flex items-center justify-between mb-20">
                  <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
                    <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.3)]">
                      <span className="text-background font-bold text-xl">NX</span>
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">Navette <span className="text-gold">Xpress</span></p>
                      <p className="text-[10px] text-foreground/40 uppercase tracking-widest">Premium Partner</p>
                    </div>
                  </Link>
                  <Link href="/" className="group flex items-center gap-2 text-foreground/50 hover:text-foreground transition-colors text-xs uppercase tracking-widest">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Retour au site</span>
                  </Link>
                </div>

                {/* Hero Text */}
                <div className="my-auto">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl leading-tight text-foreground mb-8 font-serif italic"
                    style={{ fontFamily: 'var(--font-display, serif)' }}
                  >
                    Rejoignez l&apos;élite des <br />
                    <span className="text-gold not-italic font-bold">Chauffeurs Partenaires</span>
                  </motion.h1>
                  {/* Avantages */}
                  <div className="space-y-6 mb-12">
                    {[
                      { icon: <DollarSign size={20} />, title: "Revenu Premium", desc: "Percevez l'une des meilleures commissions du marché." },
                      { icon: <Clock size={20} />, title: "Flexibilité Totale", desc: "Définissez vos propres disponibilités. Les courses vous sont assignées en fonction de votre planning." },
                      { icon: <ShieldCheck size={20} />, title: "Support Dédié", desc: "Une équipe à votre écoute 24h/24 pour vous accompagner." },
                    ].map((item, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (idx + 1) }}
                        key={idx}
                        className="flex gap-4 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-surface-2/50 border border-border flex items-center justify-center text-gold group-hover:bg-gold/10 group-hover:border-gold/30 transition-all">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{item.title}</p>
                          <p className="text-foreground/40 text-sm">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-2xl bg-surface-2/50 border border-border backdrop-blur-sm shadow-2xl"
                  >
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="#C9A84C" stroke="#C9A84C" />)}
                    </div>
                    <p className="text-foreground/70 italic text-sm leading-relaxed mb-4">
                      &quot;Être partenaire avec Navette Xpress, c&apos;est choisir l&apos;excellence. Je gère mon activité avec des clients premium dans un cadre respectueux et professionnel.&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">MK</div>
                      <p className="text-xs text-foreground/50 uppercase tracking-widest font-bold">— Moussa K., Chauffeur Partenaire</p>
                    </div>
                  </motion.div>
                </div>

                {/* Footer Stats */}
                <div className="flex justify-between items-center mt-auto pt-8 border-t border-border">
                  {[
                    { label: 'Revenu', val: '+30%' },
                    { label: 'Flexibilité', val: '100%' },
                    { label: 'Support', val: '24/7' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <p className="text-gold font-mono text-lg font-bold">{stat.val}</p>
                      <p className="text-[10px] text-foreground/30 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PANNEAU DROIT : FORMULAIRE ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-20 px-6 sm:px-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[550px]"
              >
                <div className="mb-12">
                  <span className="inline-block px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[10px] font-bold uppercase tracking-widest mb-4">
                    Formulaire de candidature
                  </span>
                  <h2 className="text-4xl text-foreground font-serif mb-4" style={{ fontFamily: 'var(--font-display, serif)' }}>
                    Postulez dès <span className="text-gold italic">maintenant</span>
                  </h2>
                  <p className="text-foreground/50 text-sm">
                    Prenez 2 minutes pour remplir ce formulaire. Notre équipe reviendra vers vous sous 48h.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* SECTION 1: IDENTITÉ */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <User size={18} className="text-gold" />
                      <h3 className="text-foreground font-medium uppercase text-xs tracking-widest">Votre Identité</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormInput
                        label="Prénom"
                        name="prenom"
                        placeholder="Ex: Amadou"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        required
                      />
                      <FormInput
                        label="Nom"
                        name="nom"
                        placeholder="Ex: Fall"
                        value={formData.nom}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormInput
                        label="Email professionnel"
                        name="email"
                        type="email"
                        placeholder="amadou@gmail.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                      <FormInput
                        label="Téléphone"
                        name="telephone"
                        type="tel"
                        placeholder="+221 ..."
                        value={formData.telephone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <FormSelect
                      label="Expérience de conduite"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      options={[
                        { value: "1-3", label: "1-3 ans" },
                        { value: "4-6", label: "4-6 ans" },
                        { value: "7-10", label: "7-10 ans" },
                        { value: "10+", label: "Plus de 10 ans" },
                      ]}
                    />
                  </div>

                  {/* SECTION 2: VÉHICULE */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <Car size={18} className="text-gold" />
                      <h3 className="text-foreground font-medium uppercase text-xs tracking-widest">Votre Véhicule</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        options={formData.vehicule.marque ? (vehicleData as any)[formData.vehicule.marque].map((m: string) => ({ value: m, label: m })) : []}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        placeholder="Ex: AA-123-BB"
                        value={formData.vehicule.immatriculation}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-4 pt-2">
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

                  {/* SECTION 3: MOTIVATION */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <Layers size={18} className="text-gold" />
                      <h3 className="text-foreground font-medium uppercase text-xs tracking-widest">Motivation & Disponibilité</h3>
                    </div>

                    <div className="space-y-2">
                      <FormSelect
                        label="Profil de disponibilité"
                        name="disponibilite"
                        value={formData.disponibilite}
                        onChange={handleInputChange}
                        required
                        options={[
                          { value: "temps-plein", label: "Temps plein (35h+/semaine)" },
                          { value: "temps-partiel", label: "Temps partiel (15-35h/semaine)" },
                          { value: "weekend", label: "Week-ends uniquement" },
                          { value: "soiree", label: "Soirées uniquement" },
                          { value: "ponctuel", label: "Ponctuel selon disponibilités" },
                        ]}
                      />
                      <p className="text-[10px] text-foreground/30 italic px-1">
                        En tant que chauffeur Navette Xpress, vous pouvez définir votre disponibilité (flexible). Les demandes vous seront assignées en fonction de vos créneaux.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-foreground/40">Vos motivations</label>
                      <textarea
                        name="motivation"
                        value={formData.motivation}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        placeholder="Parlez-nous de vous et de pourquoi vous souhaitez nous rejoindre..."
                        className="w-full bg-surface-2/50 border border-border rounded-xl p-4 text-foreground text-sm outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full py-5 bg-gold hover:bg-gold/80 text-background rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_10px_30px_rgba(201,168,76,0.3)]"
                    >
                      <div className="relative flex items-center justify-center gap-2">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin" />
                            <span>Traitement de votre dossier...</span>
                          </>
                        ) : (
                          <>
                            <span>Envoyer ma candidature</span>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                    </button>
                    <p className="text-center text-foreground/30 text-[10px] mt-6 uppercase tracking-widest">
                      © {new Date().getFullYear()} Navette Xpress — Recrutement Partenaires
                    </p>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── COMPOSANTS INTERNES ──

function FormInput({ label, name, type = "text", placeholder, value, onChange, required = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-foreground/40">{label} {required && "*"}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-surface-2/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-sm outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all"
      />
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options, required = false, disabled = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-foreground/40">{label} {required && "*"}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full bg-surface-2/50 border border-border rounded-xl px-4 py-3.5 text-foreground text-sm outline-none focus:border-gold/50 focus:bg-surface-2/70 transition-all appearance-none cursor-pointer disabled:opacity-30"
      >
        <option value="" className="bg-background">Choisir...</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="bg-background text-foreground">{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function FormCheckbox({ name, checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="w-5 h-5 border-2 border-border rounded-md bg-surface-2 peer-checked:bg-gold peer-checked:border-gold transition-all" />
        <CheckCircle2 size={12} className="absolute inset-0 m-auto text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
      <span className="text-foreground/60 text-xs group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center w-full min-h-screen px-6 text-center"
    >
      <div className="w-24 h-24 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mb-8 relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
        >
          <CheckCircle2 size={48} className="text-gold" />
        </motion.div>
        {/* Cercles d'ondes */}
        <div className="absolute inset-0 rounded-full border border-gold animate-ping opacity-20" />
      </div>

      <h1 className="text-5xl text-foreground font-serif mb-6" style={{ fontFamily: 'var(--font-display, serif)' }}>
        Candidature <span className="text-gold italic font-normal">Reçue</span>
      </h1>
      <p className="max-w-[450px] text-foreground/50 mb-10 text-lg leading-relaxed">
        Merci de votre intérêt pour Navette Xpress. Notre département de gestion des partenaires va analyser votre profil. <br />
        <span className="text-foreground/80 font-medium">Vous recevrez une réponse sous 48h.</span>
      </p>

      <Link href="/">
        <button className="px-10 py-4 bg-surface-2 border border-border hover:bg-surface-3 text-foreground rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
          <ArrowLeft size={18} />
          Retour à l&apos;accueil
        </button>
      </Link>

      {/* Orbes de fond pour la réussite */}
      <div className="orb-float absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[100px] rounded-full -z-10" />
    </motion.div>
  );
}
