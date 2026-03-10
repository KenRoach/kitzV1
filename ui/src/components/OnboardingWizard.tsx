import { useState } from 'react'
import { User, UserPlus, Check, ArrowRight, Sparkles } from 'lucide-react'
import { API } from '@/lib/constants'
import { apiFetch } from '@/lib/api'

interface OnboardingWizardProps {
  onComplete: () => void
}

const ONBOARDING_KEY = 'kitz_onboarding_complete'

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, '1')
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('+507')
  const [saving, setSaving] = useState(false)

  const handleStep1 = () => {
    if (name.trim().length >= 2) {
      setStep(1)
    }
  }

  const handleStep2 = async () => {
    setSaving(true)
    try {
      // Try to create the contact via the workspace API
      if (contactName.trim()) {
        await apiFetch(`${API.WORKSPACE}/contacts`, {
          method: 'POST',
          body: JSON.stringify({
            name: contactName.trim(),
            phone: contactPhone.trim() || undefined,
            tags: ['first-contact'],
          }),
        }).catch(() => {
          // Non-blocking — the contact creation is a nice-to-have
        })
      }
    } finally {
      setSaving(false)
      setStep(2)
    }
  }

  const handleFinish = () => {
    markOnboardingComplete()
    onComplete()
  }

  const handleSkip = () => {
    markOnboardingComplete()
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-purple-950 via-purple-900 to-black">
      <div className="w-full max-w-sm px-6">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-purple-400' : i < step ? 'w-2 bg-purple-500' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Name + Business */}
        {step === 0 && (
          <div className="space-y-6" style={{ animation: 'kitzSlideUp 0.4s ease-out' }}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
                <User className="h-7 w-7 text-purple-300" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Bienvenido/a a Kitz</h2>
              <p className="mt-2 text-sm text-purple-200/60">Cuentame sobre ti para personalizar tu experiencia</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              />
              <input
                type="text"
                placeholder="Tu negocio (ej: Vendo ropa online)"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>

            <button
              onClick={handleStep1}
              disabled={name.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-95 disabled:opacity-50"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>

            <button onClick={handleSkip} className="w-full text-center text-xs text-purple-400/50 hover:text-purple-300">
              Saltar por ahora
            </button>
          </div>
        )}

        {/* Step 1: Add first contact */}
        {step === 1 && (
          <div className="space-y-6" style={{ animation: 'kitzSlideUp 0.4s ease-out' }}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
                <UserPlus className="h-7 w-7 text-purple-300" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Agrega tu primer contacto</h2>
              <p className="mt-2 text-sm text-purple-200/60">Un cliente, un lead, o alguien de tu negocio</p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del contacto"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              />
              <input
                type="tel"
                placeholder="Telefono (opcional)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
              />
            </div>

            <button
              onClick={handleStep2}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <span className="animate-pulse">Guardando...</span>
              ) : contactName.trim() ? (
                <>
                  <Check className="h-4 w-4" />
                  Agregar y continuar
                </>
              ) : (
                <>
                  Saltar este paso
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Done! */}
        {step === 2 && (
          <div className="space-y-6 text-center" style={{ animation: 'kitzSlideUp 0.4s ease-out' }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <Sparkles className="h-8 w-8 text-green-400" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">
                {name ? `${name}, tu Kitz esta listo!` : 'Tu Kitz esta listo!'}
              </h2>
              {business && (
                <p className="mt-1 text-sm text-purple-200/60">
                  Configurado para: {business}
                </p>
              )}
            </div>

            <div className="space-y-2 text-left">
              {[
                'Explora tu CRM y agrega mas contactos',
                'Crea una orden o link de pago',
                'Conecta tu WhatsApp para atender clientes con AI',
                'Habla conmigo por el chat — preguntame lo que quieras',
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2.5 rounded-lg bg-white/5 px-3 py-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                  <span className="text-xs text-purple-200/70">{tip}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleFinish}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-bold text-purple-900 shadow-xl transition active:scale-95"
            >
              Entrar al Workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
