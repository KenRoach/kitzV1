import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Check, ArrowLeft, Sparkles, MessageCircle } from 'lucide-react'

interface CreditPack {
  credits: number
  price: number
  perCredit: string
  popular?: boolean
  savings?: string
}

const PACKS: CreditPack[] = [
  { credits: 100, price: 5, perCredit: '$0.05' },
  { credits: 500, price: 20, perCredit: '$0.04', popular: true, savings: '20%' },
  { credits: 2000, price: 60, perCredit: '$0.03', savings: '40%' },
]

// WhatsApp contact for purchasing (manual onboarding phase)
const WA_CONTACT = '50760041272'

export function PricingPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<number | null>(null)

  const handleBuy = (pack: CreditPack) => {
    setSelected(pack.credits)
    const msg = encodeURIComponent(
      `Hola! Quiero comprar ${pack.credits} creditos AI de Kitz ($${pack.price})`
    )
    window.open(`https://wa.me/${WA_CONTACT}?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold">
          <span className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            KITZ
          </span>
          <span className="ml-2 text-sm font-normal text-purple-300/60">
            AI Credits
          </span>
        </h1>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-4 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20">
          <Sparkles className="h-7 w-7 text-purple-300" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          Potencia tu negocio con AI
        </h2>
        <p className="mt-2 text-sm text-purple-200/60 max-w-xs mx-auto">
          Cada credito = 1 accion AI: email, reporte, mensaje, analisis, y mas.
        </p>
      </div>

      {/* Credit Packs */}
      <div className="px-5 pb-6 space-y-4">
        {PACKS.map((pack) => (
          <div
            key={pack.credits}
            className={`relative rounded-2xl border p-5 transition ${
              pack.popular
                ? 'border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Mas Popular
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className={`h-5 w-5 ${pack.popular ? 'text-purple-300' : 'text-purple-400/60'}`} />
                  <span className="text-2xl font-extrabold">{pack.credits.toLocaleString()}</span>
                  <span className="text-sm text-purple-300/60">creditos</span>
                </div>
                <div className="mt-1 text-xs text-purple-300/50">
                  {pack.perCredit}/credito
                  {pack.savings && (
                    <span className="ml-2 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-green-300">
                      Ahorra {pack.savings}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold">${pack.price}</div>
                <div className="text-[10px] text-purple-300/40 uppercase">USD</div>
              </div>
            </div>

            <button
              onClick={() => handleBuy(pack)}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95 ${
                pack.popular
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/30 hover:bg-green-500'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              {selected === pack.credits ? 'Abriendo WhatsApp...' : `Comprar ${pack.credits} creditos`}
            </button>
          </div>
        ))}
      </div>

      {/* What you get */}
      <div className="px-6 pb-8">
        <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-purple-400/50">
          Que puedes hacer con creditos AI
        </h3>
        <div className="space-y-2">
          {[
            'Redactar emails y mensajes de WhatsApp',
            'Crear reportes e insights de negocio',
            'Gestionar contactos y leads con CRM',
            'Generar contenido para redes sociales',
            'Responder clientes con voz (notas de voz)',
            'Analizar datos y crear facturas',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400/60" />
              <span className="text-xs text-purple-200/60">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 text-center">
        <p className="text-[10px] text-purple-400/30">
          Escribenos por WhatsApp para comprar creditos
        </p>
        <p className="mt-1 text-[10px] text-purple-400/20">
          Los creditos no expiran. Sin suscripcion, sin compromisos.
        </p>
      </div>
    </div>
  )
}
