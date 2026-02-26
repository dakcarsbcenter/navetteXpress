"use client";

import { Navigation } from "@/components/navigation";
import { useState } from "react";
import Link from "next/link";

export default function DevenirPartenaireClient() {
  // Données des marques et modèles
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

      // Si la marque change, réinitialiser le modèle
      if (vehiculeField === "marque") {
        setFormData(prev => ({
          ...prev,
          vehicule: {
            ...prev.vehicule,
            marque: value,
            modele: "" // Réinitialiser le modèle quand la marque change
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

    // Simulation d'envoi de formulaire
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="font-sans min-h-screen bg-[#FAFAFA] dark:bg-[#1A1A1A]">
        <Navigation variant="solid" />

        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-[#E5C16C]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-[#A73B3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-[#1A1A1A] dark:text-white mb-6">
              Candidature Envoyée !
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Merci pour votre candidature. Notre équipe étudiera votre profil et vous contactera
              dans les 48h pour la suite du processus de recrutement.
            </p>

            <Link href="/" className="inline-block">
              <button className="bg-[#A73B3C] hover:bg-[#8B3032] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                Retour à l&apos;accueil
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-[#FAFAFA] dark:bg-[#1A1A1A]">
      <Navigation variant="solid" />

      <main className="pt-15 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] dark:text-white mb-6">
              Devenir <span className="text-[#A73B3C]">Partenaire</span> Chauffeur
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Rejoignez notre équipe de chauffeurs professionnels et bénéficiez d&apos;une activité
              flexible avec des revenus attractifs.
            </p>
          </div>

          {/* Avantages */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-12">
            <div className="bg-white dark:bg-[#252525] p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-t-4 border-[#A73B3C]">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E5C16C]/20 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">💰</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#1A1A1A] dark:text-white mb-1 md:mb-2">Revenus Attractifs</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Revenus compétitifs avec bonus de performance</p>
            </div>

            <div className="bg-white dark:bg-[#252525] p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-t-4 border-[#A73B3C]">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E5C16C]/20 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">⏰</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#1A1A1A] dark:text-white mb-1 md:mb-2">Horaires Flexibles</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Choisissez vos créneaux selon votre disponibilité</p>
            </div>

            <div className="bg-white dark:bg-[#252525] p-4 md:p-6 rounded-xl md:rounded-2xl shadow-lg border-t-4 border-[#A73B3C]">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#E5C16C]/20 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                <span className="text-xl md:text-2xl">🤝</span>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[#1A1A1A] dark:text-white mb-1 md:mb-2">Support 24/7</h3>
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm">Équipe dédiée pour vous accompagner</p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="bg-white dark:bg-[#252525] rounded-xl md:rounded-2xl shadow-lg border-t-4 border-[#A73B3C] p-4 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Informations personnelles */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    required
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    required
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    required
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                  Années d&apos;expérience de conduite *
                </label>
                <select
                  name="experience"
                  required
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="" className="text-slate-900 bg-white">Sélectionner</option>
                  <option value="1-3" className="text-slate-900 bg-white">1-3 ans</option>
                  <option value="4-6" className="text-slate-900 bg-white">4-6 ans</option>
                  <option value="7-10" className="text-slate-900 bg-white">7-10 ans</option>
                  <option value="10+" className="text-slate-900 bg-white">Plus de 10 ans</option>
                </select>
              </div>

              {/* Informations véhicule */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 md:pt-6">
                <h3 className="text-base md:text-lg font-semibold text-[#1A1A1A] dark:text-white mb-3 md:mb-4">Informations sur votre véhicule</h3>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                      Marque *
                    </label>
                    <select
                      name="vehicule.marque"
                      required
                      value={formData.vehicule.marque}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent [&>option]:text-slate-900 [&>option]:bg-white"
                    >
                      <option value="" className="text-slate-900 bg-white">Sélectionner une marque</option>
                      {Object.keys(vehicleData).map(marque => (
                        <option key={marque} value={marque} className="text-slate-900 bg-white">
                          {marque}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                      Modèle *
                    </label>
                    <select
                      name="vehicule.modele"
                      required
                      value={formData.vehicule.modele}
                      onChange={handleInputChange}
                      disabled={!formData.vehicule.marque}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed [&>option]:text-slate-900 [&>option]:bg-white"
                    >
                      <option value="" className="text-slate-900 bg-white">
                        {formData.vehicule.marque ? 'Sélectionner un modèle' : 'Choisissez d\'abord une marque'}
                      </option>
                      {formData.vehicule.marque && vehicleData[formData.vehicule.marque as keyof typeof vehicleData]?.map(modele => (
                        <option key={modele} value={modele} className="text-slate-900 bg-white">
                          {modele}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                      Année *
                    </label>
                    <select
                      name="vehicule.annee"
                      required
                      value={formData.vehicule.annee}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent [&>option]:text-slate-900 [&>option]:bg-white"
                    >
                      <option value="" className="text-slate-900 bg-white">Sélectionner l&apos;année</option>
                      {years.map(year => (
                        <option key={year} value={year.toString()} className="text-slate-900 bg-white">
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                      Immatriculation *
                    </label>
                    <input
                      type="text"
                      name="vehicule.immatriculation"
                      required
                      value={formData.vehicule.immatriculation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                      placeholder="AB-123-CD"
                    />
                  </div>
                </div>

                <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="vehicule.assurance"
                      checked={formData.vehicule.assurance}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#A73B3C] bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-gray-600 rounded focus:ring-[#A73B3C] focus:ring-2"
                    />
                    <label className="ml-3 text-xs md:text-sm text-[#1A1A1A] dark:text-white">
                      J&apos;ai une assurance valide
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="vehicule.permis"
                      checked={formData.vehicule.permis}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#A73B3C] bg-white dark:bg-[#1A1A1A] border-gray-300 dark:border-gray-600 rounded focus:ring-[#A73B3C] focus:ring-2"
                    />
                    <label className="ml-3 text-xs md:text-sm text-[#1A1A1A] dark:text-white">
                      J&apos;ai un permis de conduire valide depuis plus de 3 ans
                    </label>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                  Motivation *
                </label>
                <textarea
                  name="motivation"
                  required
                  rows={4}
                  value={formData.motivation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent"
                  placeholder="Pourquoi souhaitez-vous devenir partenaire chauffeur ? Parlez-nous de votre expérience..."
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-[#1A1A1A] dark:text-white mb-1.5 md:mb-2">
                  Disponibilité *
                </label>
                <select
                  name="disponibilite"
                  required
                  value={formData.disponibilite}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 bg-white dark:bg-[#1A1A1A] border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#A73B3C] focus:border-transparent [&>option]:text-slate-900 [&>option]:bg-white"
                >
                  <option value="" className="text-slate-900 bg-white">Sélectionner</option>
                  <option value="temps-plein" className="text-slate-900 bg-white">Temps plein (35h+/semaine)</option>
                  <option value="temps-partiel" className="text-slate-900 bg-white">Temps partiel (15-35h/semaine)</option>
                  <option value="weekend" className="text-slate-900 bg-white">Week-ends uniquement</option>
                  <option value="soiree" className="text-slate-900 bg-white">Soirées uniquement</option>
                  <option value="ponctuel" className="text-slate-900 bg-white">Ponctuel selon disponibilités</option>
                </select>
              </div>

              <div className="text-center pt-4 md:pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-[#A73B3C] hover:bg-[#8B3032] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 md:gap-3 mx-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <span className="text-sm md:text-base">Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base md:text-lg">🤝</span>
                      <span className="text-sm md:text-base">Envoyer ma candidature</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
