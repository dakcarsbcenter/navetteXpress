"use client";

import { useTranslations } from "next-intl";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CorridorStrip } from "@/components/marketing/CorridorStrip";
import { Button } from "@/components/ui/Button";
import InteractiveMap from "@/components/ui/InteractiveMap";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneTilt, Phone, EnvelopeSimple, MapPin, CheckCircle, CaretRight, Globe, ShieldCheck, Star } from "@phosphor-icons/react";

const monoLabel = "font-[family-name:var(--font-ibm-plex-mono)]";

export default function ContactClient() {
  const t = useTranslations("contact");
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          service: formData.service,
          preferredDate: formData.date,
          message: formData.message
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          message: ''
        });
      } else {
        throw new Error(result.error || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactMethods = [
    {
      icon: <Phone size={20} weight="light" className="text-accent" />,
      title: t("methods.phone.title"),
      details: "+221 78 465 13 02",
      sub: t("methods.phone.sub"),
      link: "tel:+221784651302"
    },
    {
      icon: <EnvelopeSimple size={20} weight="light" className="text-accent" />,
      title: t("methods.email.title"),
      details: "contact@navettexpress.com",
      sub: t("methods.email.sub"),
      link: "mailto:contact@navettexpress.com"
    },
    {
      icon: <MapPin size={20} weight="light" className="text-accent" />,
      title: t("methods.office.title"),
      details: "Cité Magistrats, Cices Foire",
      sub: t("methods.office.sub"),
      link: "https://maps.google.com"
    }
  ];

  const services = t.raw("services") as string[];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="solid" />

      <div className="pt-24 md:pt-36">
        <CorridorStrip />

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 pb-10 md:pt-14 md:pb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-bold text-4xl md:text-5xl leading-[1.06] tracking-tight text-foreground">
              {t("hero.titleLine1")} <span className="text-accent">{t("hero.titleLine2")}</span>
            </h1>
            <p className="mt-5 text-base md:text-lg leading-relaxed text-[#3d3a35] max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </motion.div>
        </section>

        <section className="border-t border-[#e2dacd] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-10">

              {/* Contact Information & Methods */}
              <div className="lg:col-span-5 space-y-6">
                <div className="grid gap-4">
                  {contactMethods.map((method, idx) => (
                    <motion.a
                      key={idx}
                      href={method.link}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08 }}
                      className="group bg-white border border-[#e2dacd] rounded-lg p-6 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-11 h-11 bg-background border border-[#e2dacd] rounded flex items-center justify-center shrink-0">
                          {method.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">{method.title}</h4>
                          <p className="text-accent font-medium mb-1">{method.details}</p>
                          <p className="text-xs text-text-muted">{method.sub}</p>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* Emergency Card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-accent rounded-lg p-7 text-white"
                >
                  <div className="flex gap-3 items-center mb-3">
                    <ShieldCheck size={28} weight="light" />
                    <h3 className="text-xl font-semibold">{t("emergency.title")}</h3>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed mb-5 italic">
                    &ldquo;{t("emergency.quote")}&rdquo;
                  </p>
                  <a href="tel:+221784651302" className="inline-flex items-center gap-2 font-semibold text-sm hover:gap-3 transition-all">
                    {t("emergency.cta")} <CaretRight size={16} weight="bold" />
                  </a>
                </motion.div>

                {/* Map Component */}
                <div className="bg-white border border-[#e2dacd] rounded-lg p-3 overflow-hidden aspect-video">
                  <InteractiveMap
                    center={[14.74342, -17.472408]}
                    zoom={15}
                    height="100%"
                    showMarker={true}
                    markerTitle={t("map.markerTitle")}
                    markerDescription="Cité Magistrats, Cices Foire, Dakar"
                  />
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-[#e2dacd] rounded-lg p-8 md:p-10 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.04] text-foreground pointer-events-none">
                    <PaperPlaneTilt size={120} weight="thin" />
                  </div>

                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      {t("form.titleLine1")} <span className="text-accent">{t("form.titleLine2")}</span>
                    </h2>
                    <p className="text-text-muted mb-8 max-w-lg">
                      {t("form.subtitle")}
                    </p>

                    <AnimatePresence mode="wait">
                      {submitStatus === 'success' ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-accent/10 border border-accent/30 rounded-lg p-8 text-center"
                        >
                          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-accent w-8 h-8" weight="regular" />
                          </div>
                          <h3 className="text-2xl font-semibold text-foreground mb-2">{t("form.success.title")}</h3>
                          <p className="text-text-muted mb-6">{t("form.success.desc")}</p>
                          <button
                            onClick={() => setSubmitStatus('idle')}
                            className="text-accent font-semibold text-sm border-b border-accent pb-1"
                          >
                            {t("form.success.another")}
                          </button>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                              <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>{t("form.nameLabel")}</label>
                              <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors"
                                placeholder={t("form.namePlaceholder")}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>{t("form.emailLabel")}</label>
                              <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors"
                                placeholder={t("form.emailPlaceholder")}
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                              <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>{t("form.phoneLabel")}</label>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors"
                                placeholder="+221 ..."
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>{t("form.serviceLabel")}</label>
                              <select
                                name="service"
                                required
                                value={formData.service}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
                              >
                                <option value="">{t("form.servicePlaceholder")}</option>
                                {services.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className={`${monoLabel} text-[10px] uppercase tracking-[0.14em] text-text-muted`}>{t("form.messageLabel")}</label>
                            <textarea
                              name="message"
                              required
                              rows={4}
                              value={formData.message}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-[#d8d2c7] rounded px-4 py-3 text-foreground text-sm outline-none focus:border-accent transition-colors resize-none"
                              placeholder={t("form.messagePlaceholder")}
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            icon={<CaretRight size={18} weight="bold" />}
                            iconPosition="right"
                          >
                            {t("form.submit")}
                          </Button>

                          {submitStatus === 'error' && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center text-error text-xs font-medium"
                            >
                              {t("form.error")}
                            </motion.p>
                          )}
                        </form>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Promise Section */}
        <section className="border-t border-[#e2dacd] py-14 md:py-16">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-around gap-10">
            <div className="flex flex-col items-center gap-2">
              <Globe className="text-gold" size={32} weight="light" />
              <span className={`${monoLabel} text-xs tracking-[0.14em] uppercase text-text-muted`}>{t("brandPromise.prestige")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="text-gold" size={32} weight="light" />
              <span className={`${monoLabel} text-xs tracking-[0.14em] uppercase text-text-muted`}>{t("brandPromise.security")}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="text-gold" size={32} weight="light" />
              <span className={`${monoLabel} text-xs tracking-[0.14em] uppercase text-text-muted`}>{t("brandPromise.excellence")}</span>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
