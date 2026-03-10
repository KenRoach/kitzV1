import { useState } from 'react';
import { FileText, Building2, Target, Users, ChevronRight, Printer } from 'lucide-react';

const INDUSTRIES = [
  'Logística', 'Banca / Finanzas', 'Retail / Comercio', 'Salud', 'Gobierno',
  'Bienes Raíces', 'Legal', 'Construcción', 'Educación', 'Tecnología / IT',
];

const MODULES: Record<string, string[]> = {
  'Logística': ['WhatsApp Automation', 'Workspace CRM', 'kitz-brain Scheduler'],
  'Banca / Finanzas': ['Compliance Pipeline', 'AI Workspace', 'Payments Integration'],
  'Retail / Comercio': ['WhatsApp Bot', 'Workspace CRM', 'Content Engine'],
  'Salud': ['WhatsApp Automation', 'Compliance Pipeline', 'Comms Layer'],
  'Gobierno': ['Compliance Pipeline', 'AI Workspace', 'Audit Trail'],
  'Bienes Raíces': ['WhatsApp Bot', 'Workspace CRM', 'Proposal Generator'],
  'Legal': ['Compliance Pipeline', 'WhatsApp Automation', 'AI Workspace'],
  'Construcción': ['Workspace CRM', 'WhatsApp Bot', 'Payments Integration'],
  'Educación': ['WhatsApp Automation', 'Content Engine', 'AI Workspace'],
  'Tecnología / IT': ['Full AI Engine', 'WhatsApp Automation', 'RenewFlow'],
};

interface FormData {
  prospectName: string;
  company: string;
  industry: string;
  painPoint: string;
  companySize: string;
}

export function ProposalGenerator() {
  const [form, setForm] = useState<FormData>({ prospectName: '', company: '', industry: '', painPoint: '', companySize: '10-50' });
  const [generated, setGenerated] = useState(false);

  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const modules = MODULES[form.industry] || ['WhatsApp Bot', 'Workspace CRM', 'AI Battery'];
  const isValid = form.prospectName && form.company && form.industry && form.painPoint;

  const generate = () => {
    if (isValid) setGenerated(true);
  };

  if (generated) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setGenerated(false)} className="text-sm text-kitz-muted hover:text-kitz-text">← Volver al formulario</button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-kitz-purple hover:bg-kitz-deep text-white text-xs font-medium">
            <Printer size={12} /> Exportar PDF
          </button>
        </div>

        {/* Proposal document */}
        <div className="bg-kitz-surface border border-kitz-border rounded-xl divide-y divide-kitz-border">
          {/* Portada */}
          <div className="p-8 text-center space-y-3">
            <div className="text-xs text-kitz-purple font-mono uppercase tracking-widest">Propuesta de Negocio</div>
            <h1 className="text-2xl font-bold text-kitz-text">{form.company}</h1>
            <p className="text-sm text-kitz-muted">Preparado por Kenneth Roach / mealkitz.io</p>
            <p className="text-xs text-kitz-muted">{new Date().toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Resumen Ejecutivo */}
          <Section num="1" title="Resumen Ejecutivo">
            <p className="text-sm text-kitz-muted leading-relaxed">
              {form.company} enfrenta un desafío crítico: <span className="text-kitz-text">{form.painPoint}</span>.
              KITZ ofrece una solución de automatización AI diseñada específicamente para empresas
              de {form.industry.toLowerCase()} en Panamá y LATAM, eliminando procesos manuales y
              reduciendo costos operativos desde el día uno.
            </p>
          </Section>

          {/* Solución Propuesta */}
          <Section num="2" title="Solución Propuesta">
            <p className="text-sm text-kitz-muted mb-3">Módulos recomendados para {form.company}:</p>
            <div className="space-y-2">
              {modules.map((mod, i) => (
                <div key={mod} className="flex items-center gap-3 bg-kitz-dark rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-kitz-purple/20 text-kitz-purple flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <span className="text-sm text-kitz-text font-medium">{mod}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Implementación */}
          <Section num="3" title="Implementación (30/60/90 días)">
            <div className="grid grid-cols-3 gap-3">
              {[
                { day: '30', items: ['Configuración de módulos', 'Conexión WhatsApp', 'Primera automatización'] },
                { day: '60', items: ['CRM activo', 'Reportes semanales', 'Flujos de seguimiento'] },
                { day: '90', items: ['Automatización completa', 'ROI medible', 'Optimización continua'] },
              ].map(phase => (
                <div key={phase.day} className="bg-kitz-dark rounded-lg p-3">
                  <div className="text-xs font-bold text-kitz-purple mb-2">Día {phase.day}</div>
                  {phase.items.map(item => (
                    <div key={item} className="text-[11px] text-kitz-muted py-0.5">• {item}</div>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          {/* Inversión */}
          <Section num="4" title="Inversión">
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Starter', credits: '100', price: '$5/mes', desc: 'Ideal para empezar' },
                { name: 'Growth', credits: '500', price: '$20/mes', desc: 'Operación activa', highlight: true },
                { name: 'Scale', credits: '2,000', price: '$60/mes', desc: 'Automatización total' },
              ].map(pkg => (
                <div key={pkg.name} className={`rounded-lg p-4 ${pkg.highlight ? 'bg-kitz-purple/10 border border-kitz-purple/30' : 'bg-kitz-dark'}`}>
                  <div className="text-xs font-bold text-kitz-text">{pkg.name}</div>
                  <div className="text-lg font-bold font-mono text-kitz-purple mt-1">{pkg.price}</div>
                  <div className="text-[10px] text-kitz-muted mt-1">{pkg.credits} créditos AI Battery</div>
                  <div className="text-[10px] text-kitz-muted">{pkg.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-kitz-muted mt-3">Métodos de pago: <span className="text-kitz-purple">Yappy</span> · <span className="text-kitz-purple">BAC</span> · Stripe · PayPal</p>
          </Section>

          {/* Cumplimiento */}
          <Section num="5" title="Cumplimiento Panameño">
            <p className="text-sm text-kitz-muted leading-relaxed">
              KITZ incluye un pipeline de cumplimiento panameño integrado (kitz-services) que garantiza
              adherencia a regulaciones locales. Esto es un diferenciador clave frente a soluciones
              extranjeras que no contemplan la realidad regulatoria de Panamá.
            </p>
          </Section>

          {/* Próximos Pasos */}
          <Section num="6" title="Próximos Pasos">
            <div className="space-y-2">
              {[
                'Agendar demo de 15 minutos con Kenneth',
                'Definir módulos prioritarios para los primeros 30 días',
                'Activar cuenta y conectar WhatsApp Business',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <ChevronRight size={14} className="text-kitz-purple" />
                  <span className="text-kitz-text">{step}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-kitz-text">Generador de Propuestas</h1>
        <p className="text-sm text-kitz-muted mt-1">Propuesta de negocio completa en español, en menos de 2 minutos</p>
      </div>

      <div className="bg-kitz-surface border border-kitz-border rounded-xl p-6 space-y-4">
        <InputField icon={Users} label="Nombre del prospecto" value={form.prospectName} onChange={v => update('prospectName', v)} placeholder="María González" />
        <InputField icon={Building2} label="Empresa" value={form.company} onChange={v => update('company', v)} placeholder="Logística Express, S.A." />

        <div>
          <label className="text-xs text-kitz-muted mb-1 block">Industria</label>
          <select
            value={form.industry}
            onChange={e => update('industry', e.target.value)}
            className="w-full bg-kitz-dark border border-kitz-border rounded-lg px-3 py-2 text-sm text-kitz-text focus:outline-none focus:ring-1 focus:ring-kitz-purple"
          >
            <option value="">Seleccionar industria</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        <InputField icon={Target} label="Principal dolor" value={form.painPoint} onChange={v => update('painPoint', v)} placeholder="Respondemos WhatsApp manualmente y perdemos clientes" />

        <div>
          <label className="text-xs text-kitz-muted mb-1 block">Tamaño de empresa</label>
          <div className="flex gap-2">
            {['1-10', '10-50', '50-200', '200+'].map(size => (
              <button
                key={size}
                onClick={() => update('companySize', size)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  form.companySize === size
                    ? 'bg-kitz-purple/20 text-kitz-purple border border-kitz-purple/40'
                    : 'bg-kitz-dark border border-kitz-border text-kitz-muted hover:text-kitz-text'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-kitz-purple hover:bg-kitz-deep text-white text-sm font-medium disabled:opacity-40 transition-colors"
        >
          <FileText size={16} /> Generar Propuesta
        </button>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6">
      <h2 className="text-sm font-semibold text-kitz-text mb-3">
        <span className="text-kitz-purple font-mono mr-2">{num}.</span>{title}
      </h2>
      {children}
    </div>
  );
}

function InputField({ icon: Icon, label, value, onChange, placeholder }: {
  icon: typeof FileText; label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs text-kitz-muted mb-1 block">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kitz-muted" />
        <input
          type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-kitz-dark border border-kitz-border rounded-lg pl-9 pr-3 py-2 text-sm text-kitz-text placeholder:text-kitz-muted/50 focus:outline-none focus:ring-1 focus:ring-kitz-purple"
        />
      </div>
    </div>
  );
}
