import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Clock } from 'lucide-react';

export function ROICalculator() {
  const [messagesPerDay, setMessagesPerDay] = useState(50);
  const [tasksPerMonth, setTasksPerMonth] = useState(200);
  const [teamSize, setTeamSize] = useState(2);
  const [avgSalary, setAvgSalary] = useState(800);

  const calc = useMemo(() => {
    const teamCostMonthly = teamSize * avgSalary;
    const creditsNeeded = Math.ceil((messagesPerDay * 30 * 0.5 + tasksPerMonth * 2) / 1000);
    const kitzCost = creditsNeeded <= 100 ? 5 : creditsNeeded <= 500 ? 20 : 60;
    const savings = teamCostMonthly - kitzCost;
    const roi = teamCostMonthly > 0 ? ((savings / kitzCost) * 100) : 0;
    const paybackDays = kitzCost > 0 ? Math.ceil((kitzCost / (teamCostMonthly / 30))) : 0;
    return { teamCostMonthly, creditsNeeded, kitzCost, savings, roi, paybackDays };
  }, [messagesPerDay, tasksPerMonth, teamSize, avgSalary]);

  const chartData = [
    { name: 'Equipo Actual', cost: calc.teamCostMonthly, fill: '#EF4444' },
    { name: 'KITZ AI Battery', cost: calc.kitzCost, fill: '#22C55E' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">ROI Calculator</h1>
        <p className="text-sm text-kitz-muted mt-1">Compara tu costo actual vs KITZ AI Battery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider">Tu operación actual</h2>

          <SliderInput label="Mensajes por día (WhatsApp + Email)" value={messagesPerDay} onChange={setMessagesPerDay} min={5} max={500} step={5} unit="" />
          <SliderInput label="Tareas de agente por mes" value={tasksPerMonth} onChange={setTasksPerMonth} min={10} max={2000} step={10} unit="" />
          <SliderInput label="Personas en el equipo" value={teamSize} onChange={setTeamSize} min={1} max={20} step={1} unit="" />
          <SliderInput label="Salario promedio mensual (USD)" value={avgSalary} onChange={setAvgSalary} min={200} max={5000} step={50} unit="$" />
        </div>

        {/* Chart */}
        <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4">Costo Mensual</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={60}>
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Costo']} contentStyle={{ background: '#111118', border: '1px solid #1E1E2A', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={DollarSign} label="Ahorro Mensual" value={`$${calc.savings.toLocaleString()}`} color="green" />
        <MetricCard icon={TrendingUp} label="ROI" value={`${Math.round(calc.roi)}%`} color="purple" />
        <MetricCard icon={Clock} label="Payback" value={`${calc.paybackDays} días`} color="yellow" />
        <MetricCard icon={Calculator} label="Créditos/mes" value={`${calc.creditsNeeded}`} color="muted" />
      </div>

      {/* CFO Summary */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-3">Resumen para el CFO</h2>
        <p className="text-sm text-kitz-muted leading-relaxed">
          Con {messagesPerDay} mensajes diarios y {tasksPerMonth} tareas automatizadas por mes, KITZ reemplaza
          un equipo de {teamSize} persona{teamSize > 1 ? 's' : ''} (${calc.teamCostMonthly.toLocaleString()}/mes) por
          solo <span className="text-kitz-green font-semibold">${calc.kitzCost}/mes</span> en créditos AI Battery.
          Ahorro anual: <span className="text-kitz-green font-semibold">${(calc.savings * 12).toLocaleString()}</span>.
          Pago via <span className="text-kitz-purple">Yappy</span>, <span className="text-kitz-purple">BAC</span>, Stripe o PayPal.
        </p>
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-kitz-muted mb-1">
        <span>{label}</span>
        <span className="font-mono text-kitz-text">{unit}{value.toLocaleString()}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-kitz-border accent-kitz-purple cursor-pointer"
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: {
  icon: typeof DollarSign; label: string; value: string; color: string;
}) {
  const colors: Record<string, string> = {
    green: 'text-kitz-green bg-kitz-green/10',
    purple: 'text-kitz-purple bg-kitz-purple/10',
    yellow: 'text-kitz-yellow bg-kitz-yellow/10',
    muted: 'text-kitz-muted bg-kitz-border',
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
