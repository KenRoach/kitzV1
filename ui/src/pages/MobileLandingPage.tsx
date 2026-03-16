import { useState } from 'react'
import { MessageCircle, ShoppingCart, Users, Calendar, Zap, ArrowRight } from 'lucide-react'

interface MobileLandingPageProps {
  onEnter: () => void
}

const features = [
  {
    icon: MessageCircle,
    title: 'WhatsApp + IA',
    desc: 'Respondo a tus clientes, creo borradores, y gestiono conversaciones.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Users,
    title: 'CRM Inteligente',
    desc: 'Organizo tus contactos, leads y pipeline de ventas automaticamente.',
    color: 'from-purple-500 to-purple-700',
  },
  {
    icon: ShoppingCart,
    title: 'Ordenes y Pagos',
    desc: 'Creo ordenes, genero links de pago, y llevo control de todo.',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: Calendar,
    title: 'Calendario y Tareas',
    desc: 'Agendo citas, creo recordatorios, y gestiono tu dia a dia.',
    color: 'from-orange-500 to-amber-600',
  },
]

export function MobileLandingPage({ onEnter }: MobileLandingPageProps) {
  const [showFeatures, setShowFeatures] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-black text-white overflow-y-auto">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-14 pb-8">
        {/* Logo */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-purple-500/20 blur-2xl" />
          <h1 className="relative text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              KitZ (OS)
            </span>
          </h1>
        </div>

        <p className="mt-3 text-center text-lg font-medium text-purple-200/80">
          Tu negocio merece infraestructura
        </p>

        <p className="mt-6 text-center text-sm leading-relaxed text-purple-100/60 max-w-xs">
          Soy tu asistente de negocios con inteligencia artificial.
          Manejo tus clientes, ordenes, pagos, y comunicacion —
          mientras tu te enfocas en vender.
        </p>

        {/* CTA */}
        <button
          onClick={() => setShowFeatures(true)}
          className="mt-8 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-3.5 text-sm font-semibold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
        >
          <Zap className="h-4 w-4" />
          Que puedo hacer por ti?
        </button>
      </div>

      {/* Features — slide in */}
      {showFeatures && (
        <div className="px-5 pb-6" style={{ animation: 'kitzSlideUp 0.5s ease-out' }}>
          <div className="space-y-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-4 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm"
              >
                <f.icon className="h-5 w-5 shrink-0 text-purple-400" />
                <div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-purple-200/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">400+</div>
              <div className="text-[10px] text-purple-400/60 uppercase tracking-wider">Herramientas AI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">33</div>
              <div className="text-[10px] text-purple-400/60 uppercase tracking-wider">Agentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-300">24/7</div>
              <div className="text-[10px] text-purple-400/60 uppercase tracking-wider">Disponible</div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-8 space-y-3">
            <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-purple-400/60">Como funciona</h2>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">1</div>
              <p className="text-xs text-purple-200/70">Entra al workspace y explora tus herramientas</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">2</div>
              <p className="text-xs text-purple-200/70">Agrega tu primer cliente o crea una orden</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">3</div>
              <p className="text-xs text-purple-200/70">Escribeme por WhatsApp y deja que la IA trabaje por ti</p>
            </div>
          </div>

          {/* Enter button */}
          <button
            onClick={onEnter}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-purple-900 shadow-xl transition-all active:scale-95"
          >
            Entrar al Workspace
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Modalities */}
          <div className="mt-6 pb-8">
            <p className="text-center text-[10px] text-purple-400/40">
              Tambien puedes hablarme por WhatsApp, web, o voz
            </p>
            <p className="mt-1 text-center text-[10px] text-purple-400/30">
              Creado por Kenneth Roach
            </p>
          </div>
        </div>
      )}

      {/* If features not yet shown, show subtle scroll hint */}
      {!showFeatures && (
        <div className="flex flex-col items-center gap-4 pb-10 mt-4">
          <div className="flex items-center gap-3 text-purple-400/40">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase tracking-widest">Gratis para empezar</span>
            <Zap className="h-3.5 w-3.5" />
          </div>
          {/* Quick enter for returning users */}
          <button
            onClick={onEnter}
            className="mt-2 text-xs text-purple-400/50 underline underline-offset-4"
          >
            Ir directo al workspace
          </button>
        </div>
      )}
    </div>
  )
}
