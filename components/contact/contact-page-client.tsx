"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Rocket,
  Send,
} from "lucide-react"

import { Footer } from "@/components/footer"
import { useToast } from "@/hooks/use-toast"
import { tiktokPixel } from "@/lib/tiktok-pixel"

const CONTACT_EMAIL = "planck.fizica@gmail.com"
const PHONE_DISPLAY = "0773 715 865"
const PHONE_TEL = "+40773715865"
const PHONE_MASKED = "0773 ••• •••"

const SUBJECT_OPTIONS = [
  { value: "cursuri", label: "Întrebări despre cursuri" },
  { value: "tehnic", label: "Suport tehnic" },
  { value: "abonament", label: "Informații abonament" },
  { value: "colaborare", label: "Colaborare" },
  { value: "feedback", label: "Feedback" },
  { value: "altul", label: "Altul" },
] as const

const HELP_ITEMS = [
  "Întrebări despre cursuri și materiale",
  "Suport tehnic pentru platformă",
  "Informații despre abonamente",
  "Colaborări și propuneri",
  "Feedback și sugestii",
]

const inputClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 focus:border-[#7C5CFC] focus:ring-4 focus:ring-[#7C5CFC]/15"

type FormState = {
  name: string
  email: string
  subject: string
  message: string
}

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
}

export function ContactPageClient() {
  const { toast } = useToast()
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json()) as { success?: boolean; message?: string }

      if (!response.ok || !data.success) {
        toast({
          title: "Nu am putut trimite mesajul",
          description: data.message ?? "Încearcă din nou.",
          variant: "destructive",
        })
        return
      }

      setSent(true)
      setForm(INITIAL_FORM)
      await tiktokPixel.identify({ email: form.email })
      tiktokPixel.trackContact('contact_form', 'Formular contact Planck')
      tiktokPixel.trackSubmitForm('contact_form', 'Formular contact Planck')
      toast({
        title: "Mesaj trimis",
        description: data.message,
      })
    } catch {
      toast({
        title: "Eroare de rețea",
        description: "Verifică conexiunea și încearcă din nou.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#EBE8FF] opacity-50 blur-[110px]" />
        <div className="absolute top-32 right-[-80px] h-[280px] w-[280px] rounded-full bg-[#FFE8D6] opacity-40 blur-[90px]" />
      </div>

      <nav className="relative z-20 border-b border-gray-100/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="title-font flex items-center gap-2 text-2xl font-black text-gray-900 transition-colors hover:text-gray-700"
          >
            <Rocket className="h-6 w-6" />
            <span>PLANCK</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Acasă</span>
            </Link>
            <Link
              href="/despre"
              className="hidden h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:inline-flex"
            >
              Despre
            </Link>
            <Link
              href="/pricing"
              className="hidden h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 md:inline-flex"
            >
              Pricing
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#EBE8FF] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5B47D6]">
            <MessageCircle className="h-3.5 w-3.5" />
            Suport PLANCK
          </p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Contactează-ne
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Ai întrebări despre platformă, abonamente sau colaborări? Scrie-ne — îți răspundem rapid.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
          <aside className="space-y-5">
            <div className="rounded-[28px] bg-[#F8F7FF] p-6 ring-1 ring-black/5 sm:p-7">
              <h2 className="text-xl font-bold text-gray-900">Informații de contact</h2>
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7C5CFC] shadow-sm ring-1 ring-black/5">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="mt-1 inline-block text-[#7C5CFC] hover:underline"
                      onClick={() => tiktokPixel.trackContact("contact_email", "Email contact Planck")}
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7C5CFC] shadow-sm ring-1 ring-black/5">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">Telefon</h3>
                    {phoneRevealed ? (
                      <a
                        href={`tel:${PHONE_TEL}`}
                        className="mt-1 inline-block font-medium text-gray-800 hover:text-[#7C5CFC]"
                      >
                        {PHONE_DISPLAY}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneRevealed(true)
                          tiktokPixel.trackContact("contact_phone", "Telefon contact Planck")
                        }}
                        className="mt-2 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#7C5CFC]/40 hover:text-[#5B47D6]"
                      >
                        <Eye className="h-4 w-4" />
                        Arată numărul
                        <span className="font-mono text-gray-400">{PHONE_MASKED}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7C5CFC] shadow-sm ring-1 ring-black/5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Timp de răspuns</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      În maxim 24 de ore în zilele lucrătoare
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-7">
              <h3 className="text-lg font-bold text-gray-900">Cum te putem ajuta?</h3>
              <ul className="mt-4 space-y-3">
                {HELP_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#7C5CFC]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Trimite-ne un mesaj</h2>
            <p className="mt-2 text-sm text-gray-500">
              Completează formularul și mesajul tău ajunge direct la echipa PLANCK.
            </p>

            {sent ? (
              <div className="mt-8 rounded-2xl bg-[#F8F7FF] p-6 text-center ring-1 ring-[#EBE8FF]">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#7C5CFC] text-white">
                  <Send className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Mesajul a fost trimis</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Îți mulțumim! Revenim în maxim 24 de ore în zilele lucrătoare.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7C5CFC] hover:underline"
                >
                  Trimite un alt mesaj
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-gray-900">
                    Nume complet
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={inputClassName}
                    placeholder="Introdu numele tău"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-gray-900">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClassName}
                    placeholder="email@exemplu.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-gray-900">
                    Subiect
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                    className={inputClassName}
                  >
                    <option value="">Selectează un subiect</option>
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-gray-900">
                    Mesaj
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={6}
                    maxLength={5000}
                    value={form.message}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    className={`${inputClassName} resize-none`}
                    placeholder="Scrie mesajul tău aici..."
                  />
                </div>

                <div className="rounded-2xl bg-[#F8F7FF] p-4 text-sm text-gray-600 ring-1 ring-[#EBE8FF]">
                  Preferi email direct? Scrie-ne la{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-semibold text-[#7C5CFC] hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7C5CFC] text-base font-bold text-white shadow-[0_4px_0_#5B47D6] transition-[filter,transform] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      Trimite mesajul
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>

      <Footer theme="light" backgroundColor="bg-[#F8F7FF]" borderColor="border-gray-200" />
    </div>
  )
}
