import { useState } from 'react';
import { FileText, Plus, Building2, Package, DollarSign } from 'lucide-react';

interface Quote {
  id: string;
  client: string;
  products: string;
  oem: string;
  total: number;
  createdAt: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

const MOCK_QUOTES: Quote[] = [
  { id: 'QT-001', client: 'TechDistrib Panamá', products: 'HP Care Pack 3yr x12', oem: 'HPE', total: 8400, createdAt: '2026-03-08', status: 'sent' },
  { id: 'QT-002', client: 'InfoSys Costa Rica', products: 'Dell ProSupport Plus 3yr x8', oem: 'Dell', total: 14200, createdAt: '2026-03-06', status: 'draft' },
  { id: 'QT-003', client: 'DataCenter GT', products: 'Cisco SmartNet 1yr x20', oem: 'Cisco', total: 6800, createdAt: '2026-03-01', status: 'accepted' },
];

const statusColors = {
  draft: 'bg-kitz-border text-kitz-muted',
  sent: 'bg-kitz-purple/20 text-kitz-purple',
  accepted: 'bg-kitz-green/20 text-kitz-green',
  rejected: 'bg-kitz-red/20 text-kitz-red',
};

export function Quotes() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-kitz-text">Cotizaciones</h1>
          <p className="text-sm text-kitz-muted mt-1">TPM + OEM quoting para renovaciones de garantía</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-kitz-purple hover:bg-kitz-deep text-white text-xs font-medium"
        >
          <Plus size={14} /> Nueva Cotización
        </button>
      </div>

      {/* Quick form */}
      {showForm && (
        <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-kitz-text">Nueva Cotización</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField icon={Building2} label="Cliente" placeholder="Nombre de la empresa" />
            <FormField icon={Package} label="Producto" placeholder="HP Care Pack 3yr..." />
            <div>
              <label className="text-xs text-kitz-muted mb-1 block">OEM</label>
              <select className="w-full bg-kitz-dark border border-kitz-border rounded-lg px-3 py-2 text-sm text-kitz-text focus:outline-none focus:ring-1 focus:ring-kitz-purple">
                <option>HPE</option><option>Dell</option><option>Cisco</option><option>Lenovo</option><option>NetApp</option>
              </select>
            </div>
            <FormField icon={DollarSign} label="Total Estimado" placeholder="0.00" />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-kitz-purple hover:bg-kitz-deep text-white text-sm font-medium">Crear Borrador</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-kitz-surface border border-kitz-border text-kitz-muted text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-kitz-surface border border-kitz-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-kitz-border text-xs text-kitz-muted uppercase tracking-wider">
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Productos</th>
              <th className="text-left px-4 py-3">OEM</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Fecha</th>
              <th className="text-center px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kitz-border">
            {MOCK_QUOTES.map(q => (
              <tr key={q.id} className="hover:bg-kitz-border/30 transition-colors">
                <td className="px-4 py-3 font-mono text-kitz-muted text-xs">{q.id}</td>
                <td className="px-4 py-3 font-medium text-kitz-text">{q.client}</td>
                <td className="px-4 py-3 text-kitz-muted">{q.products}</td>
                <td className="px-4 py-3 text-kitz-muted">{q.oem}</td>
                <td className="px-4 py-3 text-right font-mono text-kitz-text">${q.total.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-kitz-muted text-xs">{q.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusColors[q.status]}`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormField({ icon: Icon, label, placeholder }: { icon: typeof FileText; label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-xs text-kitz-muted mb-1 block">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kitz-muted" />
        <input
          type="text" placeholder={placeholder}
          className="w-full bg-kitz-dark border border-kitz-border rounded-lg pl-9 pr-3 py-2 text-sm text-kitz-text placeholder:text-kitz-muted/50 focus:outline-none focus:ring-1 focus:ring-kitz-purple"
        />
      </div>
    </div>
  );
}
