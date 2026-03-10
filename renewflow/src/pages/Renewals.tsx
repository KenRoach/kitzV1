import { useState } from 'react';
import { Search } from 'lucide-react';

interface Renewal {
  id: string;
  client: string;
  product: string;
  oem: string;
  quantity: number;
  expiresAt: string;
  value: number;
  status: 'active' | 'expiring' | 'expired' | 'renewed';
}

const MOCK_RENEWALS: Renewal[] = [
  { id: 'RN-001', client: 'TechDistrib Panamá', product: 'HP ProLiant DL380 Gen10', oem: 'HPE', quantity: 12, expiresAt: '2026-04-15', value: 8400, status: 'expiring' },
  { id: 'RN-002', client: 'InfoSys Costa Rica', product: 'Dell PowerEdge R750', oem: 'Dell', quantity: 8, expiresAt: '2026-03-28', value: 12800, status: 'expiring' },
  { id: 'RN-003', client: 'DataCenter GT', product: 'Cisco Catalyst 9300', oem: 'Cisco', quantity: 20, expiresAt: '2026-05-01', value: 6200, status: 'active' },
  { id: 'RN-004', client: 'CloudNet Colombia', product: 'Lenovo ThinkSystem SR650', oem: 'Lenovo', quantity: 5, expiresAt: '2026-06-10', value: 4500, status: 'active' },
  { id: 'RN-005', client: 'ServiTech Honduras', product: 'HP ProLiant DL360', oem: 'HPE', quantity: 15, expiresAt: '2026-02-28', value: 9200, status: 'expired' },
  { id: 'RN-006', client: 'NetSolutions Panamá', product: 'Dell PowerEdge T550', oem: 'Dell', quantity: 3, expiresAt: '2026-01-15', value: 3100, status: 'renewed' },
];

const statusColors = {
  active: 'bg-kitz-green/20 text-kitz-green',
  expiring: 'bg-kitz-yellow/20 text-kitz-yellow',
  expired: 'bg-kitz-red/20 text-kitz-red',
  renewed: 'bg-kitz-purple/20 text-kitz-purple',
};

export function Renewals() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = MOCK_RENEWALS.filter(r => {
    const matchSearch = !search || r.client.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Renovaciones</h1>
        <p className="text-sm text-kitz-muted mt-1">Pipeline completo de garantías y contratos de mantenimiento</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kitz-muted" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente o producto..."
            className="w-full bg-kitz-surface border border-kitz-border rounded-lg pl-9 pr-3 py-2 text-sm text-kitz-text placeholder:text-kitz-muted/50 focus:outline-none focus:ring-1 focus:ring-kitz-purple"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'active', 'expiring', 'expired', 'renewed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-kitz-purple/20 text-kitz-purple' : 'bg-kitz-surface border border-kitz-border text-kitz-muted hover:text-kitz-text'
              }`}
            >
              {s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-kitz-border text-xs text-kitz-muted uppercase tracking-wider">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-left px-4 py-3">OEM</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-left px-4 py-3">Vence</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-center px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kitz-border">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-kitz-border/30 transition-colors">
                <td className="px-4 py-3 font-mono text-kitz-muted text-xs">{r.id}</td>
                <td className="px-4 py-3 font-medium text-kitz-text">{r.client}</td>
                <td className="px-4 py-3 text-kitz-muted">{r.product}</td>
                <td className="px-4 py-3 text-kitz-muted">{r.oem}</td>
                <td className="px-4 py-3 text-right font-mono text-kitz-text">{r.quantity}</td>
                <td className="px-4 py-3 font-mono text-kitz-muted text-xs">{r.expiresAt}</td>
                <td className="px-4 py-3 text-right font-mono text-kitz-text">${r.value.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-kitz-muted text-sm">No se encontraron renovaciones</div>
        )}
      </div>
    </div>
  );
}
