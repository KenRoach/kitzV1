import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Zap, MessageSquare, Users, Server, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  port: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
}

const SERVICES: ServiceStatus[] = [
  { name: 'kitz-gateway', port: ':4000', status: 'online', latency: 12 },
  { name: 'kitz_os', port: ':3012', status: 'online', latency: 45 },
  { name: 'kitz-llm-hub', port: ':4010', status: 'online', latency: 230 },
  { name: 'whatsapp-connector', port: ':3006', status: 'online', latency: 18 },
  { name: 'workspace', port: ':3001', status: 'online', latency: 22 },
  { name: 'kitz-brain', port: 'cron', status: 'online', latency: 0 },
  { name: 'kitz-payments', port: ':3005', status: 'degraded', latency: 890 },
  { name: 'engine/logs-api', port: ':3014', status: 'online', latency: 8 },
];

function generateChartData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    messages: Math.floor(Math.random() * 40 + 5),
    credits: +(Math.random() * 0.8 + 0.1).toFixed(1),
  }));
}

export function CommandCenter() {
  const [chartData, setChartData] = useState(generateChartData);
  const [battery, setBattery] = useState(3.2);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = () => {
    setChartData(generateChartData());
    setBattery(+(Math.random() * 4 + 0.5).toFixed(1));
    setLastRefresh(new Date());
  };

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalMessages = chartData.reduce((s, d) => s + d.messages, 0);
  const totalCredits = chartData.reduce((s, d) => s + d.credits, 0);
  const onlineCount = SERVICES.filter(s => s.status === 'online').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-kitz-text">Command Center</h1>
          <p className="text-sm text-kitz-muted mt-1">Estado de servicios, métricas y AI Battery en tiempo real</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-kitz-surface border border-kitz-border text-kitz-muted hover:text-kitz-text text-xs">
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={MessageSquare} label="Mensajes Hoy" value={totalMessages.toString()} color="purple" />
        <KPICard icon={Zap} label="AI Battery" value={`${battery.toFixed(1)} / 5.0`} color="yellow" />
        <KPICard icon={Server} label="Servicios Online" value={`${onlineCount}/${SERVICES.length}`} color="green" />
        <KPICard icon={Users} label="Contactos Activos" value="47" color="muted" />
      </div>

      {/* Service grid */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4">Estado de Servicios</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SERVICES.map(svc => (
            <div key={svc.name} className="bg-kitz-dark rounded-lg p-3 flex items-center gap-3">
              <StatusDot status={svc.status} />
              <div className="min-w-0">
                <div className="text-xs font-mono text-kitz-text truncate">{svc.name}</div>
                <div className="text-[10px] text-kitz-muted">{svc.port} · {svc.latency}ms</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity chart */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider">Actividad (24h)</h2>
          <span className="text-[10px] text-kitz-muted">
            Última actualización: {lastRefresh.toLocaleTimeString('es-PA')}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1E1E2A', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="messages" stroke="#A855F7" fill="url(#msgGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Battery gauge */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider mb-4">AI Battery</h2>
        <div className="flex items-center gap-4">
          <Zap size={24} className="text-kitz-yellow" />
          <div className="flex-1">
            <div className="w-full h-4 bg-kitz-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(battery / 5) * 100}%`,
                  background: battery > 3 ? '#22C55E' : battery > 1 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-kitz-muted mt-1">
              <span>0</span>
              <span>{battery.toFixed(1)} créditos restantes</span>
              <span>5.0</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-kitz-muted mt-3">
          Consumo hoy: {totalCredits.toFixed(1)} créditos · Límite diario: 5.0 · Reset: medianoche UTC-5
        </p>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: 'online' | 'degraded' | 'offline' }) {
  const styles = {
    online: 'bg-kitz-green',
    degraded: 'bg-kitz-yellow',
    offline: 'bg-kitz-red',
  };
  return (
    <div className="relative">
      <div className={`w-2.5 h-2.5 rounded-full ${styles[status]}`} />
      {status === 'online' && <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${styles[status]} animate-ping opacity-30`} />}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: typeof Activity; label: string; value: string; color: string;
}) {
  const colors: Record<string, string> = {
    purple: 'text-kitz-purple bg-kitz-purple/10',
    green: 'text-kitz-green bg-kitz-green/10',
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
