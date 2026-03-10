import { Users, MapPin, TrendingUp, DollarSign } from 'lucide-react';

interface Reseller {
  name: string;
  country: string;
  specialization: string;
  activeRenewals: number;
  revenue: number;
  tier: 'gold' | 'silver' | 'bronze';
}

const MOCK_RESELLERS: Reseller[] = [
  { name: 'TechDistrib Panamá', country: 'Panamá', specialization: 'HPE Servers', activeRenewals: 42, revenue: 28400, tier: 'gold' },
  { name: 'InfoSys Costa Rica', country: 'Costa Rica', specialization: 'Dell Storage', activeRenewals: 31, revenue: 19200, tier: 'gold' },
  { name: 'DataCenter GT', country: 'Guatemala', specialization: 'Cisco Networking', activeRenewals: 28, revenue: 14800, tier: 'silver' },
  { name: 'CloudNet Colombia', country: 'Colombia', specialization: 'Lenovo Compute', activeRenewals: 15, revenue: 8900, tier: 'silver' },
  { name: 'ServiTech Honduras', country: 'Honduras', specialization: 'HPE ProLiant', activeRenewals: 8, revenue: 4200, tier: 'bronze' },
  { name: 'NetSolutions Panamá', country: 'Panamá', specialization: 'Multi-vendor', activeRenewals: 6, revenue: 3100, tier: 'bronze' },
];

const tierColors = {
  gold: 'bg-kitz-yellow/20 text-kitz-yellow',
  silver: 'bg-kitz-border text-kitz-muted',
  bronze: 'bg-kitz-red/10 text-kitz-red',
};

export function Resellers() {
  const totalRevenue = MOCK_RESELLERS.reduce((s, r) => s + r.revenue, 0);
  const totalRenewals = MOCK_RESELLERS.reduce((s, r) => s + r.activeRenewals, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Resellers</h1>
        <p className="text-sm text-kitz-muted mt-1">Red de socios de canal en LATAM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Resellers Activos" value={MOCK_RESELLERS.length.toString()} color="purple" />
        <StatCard icon={TrendingUp} label="Renovaciones Totales" value={totalRenewals.toString()} color="green" />
        <StatCard icon={DollarSign} label="Revenue Canal" value={`$${totalRevenue.toLocaleString()}`} color="yellow" />
        <StatCard icon={MapPin} label="Países" value="5" color="muted" />
      </div>

      {/* Reseller grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_RESELLERS.map(r => (
          <div key={r.name} className="bg-kitz-surface border border-kitz-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-kitz-text">{r.name}</div>
                <div className="text-xs text-kitz-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {r.country} · {r.specialization}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${tierColors[r.tier]}`}>
                {r.tier}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-kitz-dark rounded-lg p-3">
                <div className="text-[10px] text-kitz-muted uppercase">Renovaciones</div>
                <div className="text-lg font-bold font-mono text-kitz-text">{r.activeRenewals}</div>
              </div>
              <div className="bg-kitz-dark rounded-lg p-3">
                <div className="text-[10px] text-kitz-muted uppercase">Revenue</div>
                <div className="text-lg font-bold font-mono text-kitz-text">${r.revenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: string; color: string;
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
