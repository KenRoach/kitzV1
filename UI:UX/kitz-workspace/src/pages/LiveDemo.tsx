import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Shield, Brain, Cpu, Users, Database, FileText, Zap, Play, RotateCcw } from 'lucide-react';

const STEPS = [
  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp Connector', port: ':3006', desc: 'Mensaje entrante de prospecto', cost: 0 },
  { id: 'gateway', icon: Shield, label: 'kitz-gateway', port: ':4000', desc: 'Auth zero-trust + RBAC', cost: 0 },
  { id: 'kitz_os', icon: Brain, label: 'kitz_os', port: ':3012', desc: 'Semantic Router → 5 fases', cost: 0.2 },
  { id: 'llm_hub', icon: Cpu, label: 'kitz-llm-hub', port: ':4010', desc: 'Claude Haiku → clasificar intento', cost: 0.5 },
  { id: 'aos', icon: Users, label: 'AOS Agent', port: '', desc: 'CRO Agent → cotización laptops', cost: 0.3 },
  { id: 'workspace', icon: Database, label: 'workspace', port: ':3001', desc: 'CRM registra orden + contacto', cost: 0 },
  { id: 'logs', icon: FileText, label: 'engine/logs-api', port: ':3014', desc: 'Audit trail + traceId', cost: 0 },
];

const SCENARIOS = [
  { name: 'Cotización Laptops', message: 'Hola, necesito 10 laptops Dell para mi oficina en Costa del Este' },
  { name: 'Renovación Garantía', message: 'Necesito renovar la garantía de 25 servidores HP ProLiant' },
  { name: 'Automatización WhatsApp', message: 'Quiero automatizar las respuestas de WhatsApp de mi tienda' },
];

export function LiveDemo() {
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [battery, setBattery] = useState(5.0);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const scenario = SCENARIOS[scenarioIdx];

  const reset = useCallback(() => {
    setRunning(false);
    setActiveStep(-1);
    setBattery(5.0);
    setLogs([]);
  }, []);

  const run = useCallback(() => {
    reset();
    setRunning(true);
    setLogs([`→ ${scenario.message}`]);

    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(i);
        setBattery(prev => Math.max(0, +(prev - step.cost).toFixed(1)));
        setLogs(prev => [...prev, `[${step.label}] ${step.desc}`]);
        if (i === STEPS.length - 1) {
          setTimeout(() => {
            setLogs(prev => [...prev, '✓ Respuesta enviada al prospecto via WhatsApp']);
            setRunning(false);
          }, 800);
        }
      }, 1200 * (i + 1));
    });
  }, [scenario, reset]);

  useEffect(() => { reset(); }, [scenarioIdx, reset]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Live Pipeline Demo</h1>
        <p className="text-sm text-kitz-muted mt-1">60 segundos — mira cómo KitZ (OS) procesa un mensaje real</p>
      </div>

      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((s, i) => (
          <button
            key={i}
            onClick={() => { setScenarioIdx(i); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              i === scenarioIdx
                ? 'bg-kitz-purple/20 text-kitz-purple border border-kitz-purple/40'
                : 'bg-kitz-surface border border-kitz-border text-kitz-muted hover:text-kitz-text'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Pipeline visualization */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono text-kitz-muted uppercase tracking-wider">Pipeline de 7 pasos</span>
          <div className="flex items-center gap-3">
            {/* Battery gauge */}
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-kitz-yellow" />
              <span className="text-xs font-mono text-kitz-yellow">{battery.toFixed(1)} créditos</span>
              <div className="w-20 h-1.5 bg-kitz-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-kitz-yellow rounded-full"
                  animate={{ width: `${(battery / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            const isPast = i < activeStep;
            return (
              <motion.div
                key={step.id}
                animate={{
                  borderColor: isActive ? '#A855F7' : isPast ? '#22C55E' : '#1E1E2A',
                  backgroundColor: isActive ? 'rgba(168,85,247,0.08)' : 'transparent',
                }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg p-3 text-center space-y-2"
              >
                <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-kitz-purple/20 text-kitz-purple' : isPast ? 'bg-kitz-green/20 text-kitz-green' : 'bg-kitz-border text-kitz-muted'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="text-[11px] font-mono font-medium text-kitz-text truncate">{step.label}</div>
                {step.port && <div className="text-[10px] text-kitz-muted font-mono">{step.port}</div>}
                <AnimatePresence>
                  {(isActive || isPast) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-kitz-muted"
                    >
                      {step.desc}
                    </motion.div>
                  )}
                </AnimatePresence>
                {isActive && step.cost > 0 && (
                  <div className="text-[10px] text-kitz-yellow font-mono">-{step.cost} crédito</div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-kitz-purple hover:bg-kitz-deep text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Play size={14} /> {running ? 'Ejecutando...' : 'Iniciar Demo'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-kitz-surface border border-kitz-border text-kitz-muted hover:text-kitz-text text-sm transition-colors"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-kitz-dark border border-kitz-border rounded-xl p-4 font-mono text-xs max-h-48 overflow-y-auto">
        <div className="text-kitz-muted mb-2">$ kitz-os --trace</div>
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`py-0.5 ${log.startsWith('✓') ? 'text-kitz-green' : log.startsWith('→') ? 'text-kitz-purple' : 'text-kitz-text'}`}
          >
            {log}
          </motion.div>
        ))}
        {running && <span className="text-kitz-purple cursor-blink">▊</span>}
      </div>
    </div>
  );
}
