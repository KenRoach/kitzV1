import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, MessageSquare, Database, Shield, CreditCard, Brain, Phone, Clock } from 'lucide-react';

interface Answer {
  questionIdx: number;
  value: string;
}

const QUESTIONS = [
  {
    question: '¿Dónde ocurren las conversaciones con tus clientes hoy?',
    options: ['WhatsApp', 'Email', 'Instagram DM', 'Teléfono', 'Presencial'],
  },
  {
    question: '¿Cuál es el mayor cuello de botella en tu operación?',
    options: ['Responder mensajes a tiempo', 'Dar seguimiento a prospectos', 'Generar cotizaciones', 'Gestionar pedidos', 'Reportes y métricas'],
  },
  {
    question: '¿Manejas contratos o renovaciones recurrentes?',
    options: ['Sí, muchos', 'Algunos', 'No, todo es venta única'],
  },
  {
    question: '¿Cuántas personas manejan ventas y atención al cliente?',
    options: ['Solo yo', '2-5', '6-20', 'Más de 20'],
  },
  {
    question: '¿Usas alguna herramienta de automatización o CRM actualmente?',
    options: ['Nada, todo es manual', 'Excel / Google Sheets', 'Un CRM básico', 'Herramientas avanzadas'],
  },
];

const MODULE_MAP: Record<string, { name: string; icon: typeof MessageSquare; desc: string; port: string }> = {
  'WhatsApp Bot': { name: 'WhatsApp Bot', icon: MessageSquare, desc: 'Automatización de conversaciones WhatsApp', port: ':3006' },
  'AI Workspace': { name: 'AI Workspace', icon: Database, desc: 'CRM, pedidos, tareas, checkout', port: ':3001' },
  'Compliance Hub': { name: 'Compliance Hub', icon: Shield, desc: 'Pipeline de cumplimiento panameño', port: ':3010' },
  'Payments': { name: 'Payments', icon: CreditCard, desc: 'Stripe, PayPal, Yappy, BAC', port: ':3005' },
  'Full AI Engine': { name: 'Full AI Engine', icon: Brain, desc: 'Stack completo de automatización', port: ':3012' },
  'Comms Layer': { name: 'Comms Layer', icon: Phone, desc: 'Talk, Text, Email via Twilio', port: ':3013' },
  'Scheduler': { name: 'kitz-brain Scheduler', icon: Clock, desc: 'Agentes diarios/semanales automatizados', port: 'cron' },
};

function recommendModules(answers: Answer[]): string[] {
  const modules = new Set<string>();
  const vals = answers.map(a => a.value);

  if (vals.includes('WhatsApp') || vals.includes('Instagram DM')) modules.add('WhatsApp Bot');
  if (vals.includes('Responder mensajes a tiempo') || vals.includes('Dar seguimiento a prospectos')) modules.add('WhatsApp Bot');
  if (vals.includes('Gestionar pedidos') || vals.includes('Generar cotizaciones')) modules.add('AI Workspace');
  if (vals.includes('Reportes y métricas')) modules.add('AI Workspace');
  if (vals.includes('Sí, muchos') || vals.includes('Algunos')) modules.add('Payments');
  if (vals.includes('Más de 20') || vals.includes('6-20')) modules.add('Full AI Engine');
  if (vals.includes('Teléfono') || vals.includes('Email')) modules.add('Comms Layer');
  if (vals.includes('Nada, todo es manual')) modules.add('Scheduler');

  if (modules.size === 0) modules.add('WhatsApp Bot');
  if (!modules.has('AI Workspace')) modules.add('AI Workspace');

  return Array.from(modules);
}

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isComplete = step >= QUESTIONS.length;
  const recommended = isComplete ? recommendModules(answers) : [];
  const progress = (step / QUESTIONS.length) * 100;

  const selectAndNext = (value: string) => {
    setSelectedOption(value);
    setTimeout(() => {
      setAnswers(prev => [...prev.filter(a => a.questionIdx !== step), { questionIdx: step, value }]);
      setSelectedOption(null);
      setStep(prev => prev + 1);
    }, 300);
  };

  const goBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
      setSelectedOption(null);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setSelectedOption(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Flujo de Onboarding</h1>
        <p className="text-sm text-kitz-muted mt-1">Mapea tu negocio a los módulos correctos de KITZ</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-kitz-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-kitz-purple rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-kitz-surface border border-kitz-border rounded-xl p-6"
          >
            <div className="text-xs text-kitz-muted mb-2 font-mono">Pregunta {step + 1} de {QUESTIONS.length}</div>
            <h2 className="text-lg font-semibold text-kitz-text mb-6">{QUESTIONS[step].question}</h2>

            <div className="space-y-2">
              {QUESTIONS[step].options.map(opt => (
                <button
                  key={opt}
                  onClick={() => selectAndNext(opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all ${
                    selectedOption === opt
                      ? 'bg-kitz-purple/20 border border-kitz-purple/40 text-kitz-purple'
                      : 'bg-kitz-dark border border-kitz-border text-kitz-text hover:border-kitz-purple/30'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button onClick={goBack} className="flex items-center gap-1 mt-4 text-xs text-kitz-muted hover:text-kitz-text">
                <ChevronLeft size={12} /> Anterior
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Module map */}
            <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <Check size={14} className="text-kitz-green" /> Módulos Recomendados
              </h2>
              <div className="space-y-3">
                {recommended.map((modKey, i) => {
                  const mod = MODULE_MAP[modKey];
                  if (!mod) return null;
                  const Icon = mod.icon;
                  return (
                    <div key={modKey} className="flex items-center gap-4 bg-kitz-dark rounded-lg p-4">
                      <div className="w-8 h-8 rounded-lg bg-kitz-purple/15 text-kitz-purple flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <div className="w-8 h-8 rounded-lg bg-kitz-border flex items-center justify-center text-kitz-muted">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-kitz-text">{mod.name}</div>
                        <div className="text-[11px] text-kitz-muted">{mod.desc} · {mod.port}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 30-day plan */}
            <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4">Plan 30 Días</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { week: 'Semana 1', items: ['Activar módulo principal', 'Conectar WhatsApp', 'Importar contactos'] },
                  { week: 'Semana 2', items: ['Primera automatización', 'Configurar CRM', 'Probar flujo completo'] },
                  { week: 'Semana 3', items: ['Activar segundo módulo', 'Entrenar al equipo', 'Primeras métricas'] },
                  { week: 'Semana 4', items: ['Optimizar flujos', 'Medir primer ROI', 'Planear expansión'] },
                ].map(w => (
                  <div key={w.week} className="bg-kitz-dark rounded-lg p-3">
                    <div className="text-xs font-bold text-kitz-purple mb-2">{w.week}</div>
                    {w.items.map(item => <div key={item} className="text-[11px] text-kitz-muted py-0.5">• {item}</div>)}
                  </div>
                ))}
              </div>
            </div>

            {/* Welcome message */}
            <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-3">Mensaje de Bienvenida (WhatsApp)</h2>
              <div className="bg-kitz-dark rounded-lg p-4 text-sm text-kitz-text leading-relaxed font-mono">
                Hola! 👋 Bienvenido a KITZ. Tu cuenta está activa con{' '}
                {recommended.length} módulo{recommended.length > 1 ? 's' : ''}: {recommended.join(', ')}.
                Tu primera meta: automatizar tu canal principal en 7 días. ¿Empezamos? 🚀
              </div>
            </div>

            {/* First win */}
            <div className="bg-kitz-purple/10 border border-kitz-purple/30 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-kitz-purple uppercase tracking-wider mb-2">Primera Victoria (Semana 1)</h2>
              <p className="text-sm text-kitz-text">
                {recommended.includes('WhatsApp Bot')
                  ? 'Responder automáticamente a los primeros 10 mensajes de WhatsApp sin intervención manual.'
                  : 'Registrar tu primer pedido completo en el workspace — desde contacto hasta pago.'}
              </p>
            </div>

            <button onClick={restart} className="text-xs text-kitz-muted hover:text-kitz-text">← Empezar de nuevo</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
