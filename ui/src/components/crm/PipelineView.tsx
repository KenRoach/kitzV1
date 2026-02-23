import { cn } from '@/lib/utils'
import { useWorkspaceStore, PIPELINE_STAGES, STAGE_LABELS, STAGE_COLORS, type Lead, type PipelineStage } from '@/stores/workspaceStore'
import { DollarSign, Phone, Mail } from 'lucide-react'

interface PipelineViewProps {
  onSelectLead: (lead: Lead) => void
}

function PipelineCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-md hover:border-purple-500/30"
    >
      <p className="font-semibold text-black">{lead.name}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {lead.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-[11px] text-gray-600">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
        {lead.value != null && lead.value > 0 && (
          <span className="flex items-center gap-1 font-semibold text-purple-500">
            <DollarSign className="h-3 w-3" />{lead.value}
          </span>
        )}
        {lead.phone && <Phone className="h-3 w-3" />}
        {lead.email && <Mail className="h-3 w-3" />}
      </div>
    </button>
  )
}

function PipelineColumn({ stage, leads, onSelectLead, onDrop }: {
  stage: PipelineStage
  leads: Lead[]
  onSelectLead: (lead: Lead) => void
  onDrop: (leadId: string, stage: PipelineStage) => void
}) {
  const color = STAGE_COLORS[stage]
  const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0)

  return (
    <div
      className="flex min-w-[240px] flex-1 flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const leadId = e.dataTransfer.getData('leadId')
        if (leadId) onDrop(leadId, stage)
      }}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', color.dot)} />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-700">
            {STAGE_LABELS[stage]}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-500">
            {leads.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="font-mono text-xs text-gray-400">${totalValue.toLocaleString()}</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 rounded-xl bg-gray-50/50 p-2 min-h-[120px]">
        {leads.map((lead) => (
          <div
            key={lead.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
            className="cursor-grab active:cursor-grabbing"
          >
            <PipelineCard lead={lead} onClick={() => onSelectLead(lead)} />
          </div>
        ))}
        {leads.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8">
            <span className="font-mono text-xs text-gray-300">drag here</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineView({ onSelectLead }: PipelineViewProps) {
  const { leads, updateLeadStage } = useWorkspaceStore()

  const activeStages: PipelineStage[] = ['new', 'contacted', 'qualified', 'proposal']
  const closedStages: PipelineStage[] = ['won', 'lost']

  const handleDrop = (leadId: string, stage: PipelineStage) => {
    updateLeadStage(leadId, stage)
  }

  const totalPipeline = leads
    .filter((l) => l.stage !== 'lost')
    .reduce((sum, l) => sum + (l.value ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Pipeline summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-black">Pipeline</h3>
          <p className="text-sm text-gray-500">Drag contacts between stages</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-black">${totalPipeline.toLocaleString()}</p>
          <p className="font-mono text-xs text-gray-400">total pipeline value</p>
        </div>
      </div>

      {/* Stage progress bar — purple where leads exist, gray otherwise */}
      <div className="flex gap-1">
        {PIPELINE_STAGES.filter((s) => s !== 'lost').map((stage) => {
          const count = leads.filter((l) => l.stage === stage).length
          return (
            <div
              key={stage}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                count > 0 ? 'bg-purple-500' : 'bg-gray-200',
              )}
            />
          )
        })}
      </div>

      {/* Active pipeline columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {activeStages.map((stage) => (
          <PipelineColumn
            key={stage}
            stage={stage}
            leads={leads.filter((l) => l.stage === stage)}
            onSelectLead={onSelectLead}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Closed deals row */}
      <div className="flex gap-4">
        {closedStages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage)
          return (
            <div
              key={stage}
              className="flex-1 rounded-xl border border-gray-200 bg-white p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const leadId = e.dataTransfer.getData('leadId')
                if (leadId) handleDrop(leadId, stage)
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('h-2 w-2 rounded-full', STAGE_COLORS[stage].dot)} />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {STAGE_LABELS[stage]}
                </span>
                <span className="font-mono text-[10px] text-gray-400">({stageLeads.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stageLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition hover:shadow-sm cursor-grab',
                      STAGE_COLORS[stage].bg, STAGE_COLORS[stage].text,
                    )}
                  >
                    {lead.name}
                  </button>
                ))}
                {stageLeads.length === 0 && (
                  <span className="font-mono text-xs text-gray-300">none</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
