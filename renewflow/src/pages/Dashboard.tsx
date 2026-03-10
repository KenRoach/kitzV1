import { RotateCcw, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

const STATS = [
  { icon: RotateCcw, label: 'Renovaciones Activas', value: '142', color: 'purple' },
  { icon: DollarSign, label: 'Revenue Pipeline', value: '$48,200', color: 'green' },
  { icon: AlertTriangle, label: 'Vencen en 30 días', value: '23', color: 'yellow' },
  { icon: TrendingUp, label: 'Tasa de Renovación', value: '78%', color: 'green' },
];

const RECENT = [
  { client: 'TechDistrib Panamá', product: 'HP ProLiant DL380 x12', expires: '2026-04-15', value: '$8,400', status: 'pending' as const },
  { client: 'InfoSys Costa Rica', product: 'Dell PowerEdge R750 x8', expires: '2026-03-28', value: '$12,800', status: 'urgent' as const },
  { client: 'DataCenter GT', product: 'Cisco Catalyst 9300 x20', expires: '2026-05-01', value: '$6,200', status: 'sent' as const },
  { client: 'CloudNet Colombia', product: 'Lenovo ThinkSystem SR650 x5', expires: '2026-06-10', value: '$4,500', status: 'pending' as const },
];

const statusColors = {
  pending: 'bg-kitz-yellow/20 text-kitz-yellow',
  urgent: 'bg-kitz-red/20 text-kitz-red',
  sent: 'bg-kitz-purple/20 text-kitz-purple',
  renewed: 'bg-kitz-green/20 text-kitz-green',
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Dashboard</h1>
        <p className="text-sm text-kitz-muted mt-1">Vista general del pipeline de renovaciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ icon: Icon, label, value, color }) => {
          const colors: Record<string, string> = {
            purple: 'text-kitz-purple bg-kitz-purple/10',
            green: 'text-kitz-green bg-kitz-green/10',
            yellow: 'text-kitz-yellow bg-kitz-yellow/10',
          };
          return (
            <div key={label} className="bg-kitz-surface border border-kitz-border rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[color]}`}>
                <Icon size={16} />
              </div>
              <div className="text-[10px] text-kitz-muted uppercase tracking-wider">{label}</div>
              <div className="text-xl font-bold font-mono text-kitz-text mt-0.5">{value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent renewals */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl">
        <div className="px-6 py-4 border-b border-kitz-border">
          <h2 className="text-sm font-semibold text-kitz-text uppercase tracking-wider">Renovaciones Recientes</h2>
        </div>
        <div className="divide-y divide-kitz-border">
          {RECENT.map((r, i) => (
            <div key={i} className="px-6 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-kitz-text">{r.client}</div>
                <div className="text-xs text-kitz-muted">{r.product}</div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <div className="text-sm font-mono text-kitz-text">{r.value}</div>
                  <div className="text-[10px] text-kitz-muted">Vence: {r.expires}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusColors[r.status]}`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
