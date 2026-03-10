import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, Users, DollarSign, Calendar } from 'lucide-react';

const CATEGORIES = [
  { key: 'llm', label: 'Llamadas LLM', unit: '/mes', min: 0, max: 5000, step: 50, default: 500, creditRate: 0.001 },
  { key: 'agent', label: 'Tareas de agente', unit: '/mes', min: 0, max: 2000, step: 10, default: 200, creditRate: 0.005 },
  { key: 'whatsapp', label: 'Mensajes WhatsApp', unit: '/mes', min: 0, max: 10000, step: 50, default: 1500, creditRate: 0.0003 },
  { key: 'notifications', label: 'Notificaciones', unit: '/mes', min: 0, max: 5000, step: 50, default: 300, creditRate: 0.0001 },
  { key: 'cron', label: 'Jobs programados', unit: '/mes', min: 0, max: 500, step: 5, default: 60, creditRate: 0.01 },
];

const CHART_COLORS = ['#A855F7', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444'];

export function BatteryCalculator() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c.key, c.default]))
  );
  const [teamSize, setTeamSize] = useState(2);
  const [avgSalary, setAvgSalary] = useState(800);

  const update = (key: string, val: number) => setValues(prev => ({ ...prev, [key]: val }));

  const calc = useMemo(() => {
    const breakdown = CATEGORIES.map(c => ({
      name: c.label,
      credits: Math.round(values[c.key] * c.creditRate * 100) / 100,
    }));
    const totalCredits = breakdown.reduce((sum, b) => sum + b.credits, 0);
    const kitzCost = totalCredits <= 100 ? 5 : totalCredits <= 500 ? 20 : 60;
    const teamCost = teamSize * avgSalary;
    const savings = teamCost - kitzCost;
    const paybackDays = kitzCost > 0 ? Math.ceil(kitzCost / (teamCost / 30)) : 0;
    return { breakdown, totalCredits: Math.round(totalCredits), kitzCost, teamCost, savings, paybackDays };
  }, [values, teamSize, avgSalary]);

  const pieData = calc.breakdown.filter(b => b.credits > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">AI Battery Calculator</h1>
        <p className="text-sm text-kitz-muted mt-1">Desglose exacto de consumo de créditos por categoría</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider">Uso Mensual Estimado</h2>
          {CATEGORIES.map(c => (
            <div key={c.key}>
              <div className="flex justify-between text-xs text-kitz-muted mb-1">
                <span>{c.label}</span>
                <span className="font-mono text-kitz-text">{values[c.key].toLocaleString()}{c.unit}</span>
              </div>
              <input
                type="range" min={c.min} max={c.max} step={c.step} value={values[c.key]}
                onChange={e => update(c.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-kitz-border accent-kitz-purple cursor-pointer"
              />
            </div>
          ))}

          <div className="border-t border-kitz-border pt-4 mt-4 space-y-4">
            <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider">Comparación con Equipo</h2>
            <div>
              <div className="flex justify-between text-xs text-kitz-muted mb-1">
                <span>Personas en equipo</span>
                <span className="font-mono text-kitz-text">{teamSize}</span>
              </div>
              <input type="range" min={1} max={20} step={1} value={teamSize} onChange={e => setTeamSize(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-kitz-border accent-kitz-purple cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-kitz-muted mb-1">
                <span>Salario promedio (USD)</span>
                <span className="font-mono text-kitz-text">${avgSalary.toLocaleString()}</span>
              </div>
              <input type="range" min={200} max={5000} step={50} value={avgSalary} onChange={e => setAvgSalary(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-kitz-border accent-kitz-purple cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Pie chart + gauge */}
        <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4">Desglose de Créditos</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="credits" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1E1E2A', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-kitz-muted text-sm">Ajusta los sliders</div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {calc.breakdown.map((b, i) => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-kitz-muted truncate">{b.name}</span>
                <span className="font-mono text-kitz-text ml-auto">{b.credits}</span>
              </div>
            ))}
          </div>

          {/* Battery gauge */}
          <div className="mt-6 pt-4 border-t border-kitz-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-kitz-muted">AI Battery</span>
              <span className="text-sm font-mono font-bold text-kitz-yellow">{calc.totalCredits} créditos/mes</span>
            </div>
            <div className="w-full h-3 bg-kitz-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (calc.totalCredits / 2000) * 100)}%`,
                  background: calc.totalCredits <= 100 ? '#22C55E' : calc.totalCredits <= 500 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-kitz-muted mt-1 font-mono">
              <span>100 ($5)</span><span>500 ($20)</span><span>2000 ($60)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Créditos/mes" value={`${calc.totalCredits}`} color="yellow" />
        <StatCard icon={DollarSign} label="Costo KITZ" value={`$${calc.kitzCost}/mes`} color="green" />
        <StatCard icon={Users} label="Costo Equipo" value={`$${calc.teamCost.toLocaleString()}/mes`} color="red" />
        <StatCard icon={Calendar} label="Payback" value={`${calc.paybackDays} días`} color="purple" />
      </div>

      {/* CFO Summary */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-3">Resumen CFO</h2>
        <p className="text-sm text-kitz-muted leading-relaxed">
          Tu operación consume ~{calc.totalCredits} créditos AI Battery por mes, lo cual cuesta{' '}
          <span className="text-kitz-green font-semibold">${calc.kitzCost}/mes</span> vs{' '}
          <span className="text-kitz-red font-semibold">${calc.teamCost.toLocaleString()}/mes</span> con un equipo de {teamSize} persona{teamSize > 1 ? 's' : ''}.
          Ahorro mensual: <span className="text-kitz-green font-semibold">${calc.savings.toLocaleString()}</span>.
          Recuperación en {calc.paybackDays} días. Pago via Yappy, BAC, Stripe o PayPal.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Zap; label: string; value: string; color: string;
}) {
  const colors: Record<string, string> = {
    green: 'text-kitz-green bg-kitz-green/10', purple: 'text-kitz-purple bg-kitz-purple/10',
    yellow: 'text-kitz-yellow bg-kitz-yellow/10', red: 'text-kitz-red bg-kitz-red/10',
  };
  return (
    <div className="bg-kitz-surface border border-kitz-border rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div className="text-[10px] text-kitz-muted uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold font-mono text-kitz-text mt-0.5">{value}</div>
    </div>
  );
}
