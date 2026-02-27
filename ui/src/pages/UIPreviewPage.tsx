import { useState } from 'react'
import { Search, Plus, Trash2, Settings, Users, Package, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableEmpty } from '@/components/ui/Table'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export default function UIPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-12">
      <div className="mx-auto max-w-5xl space-y-16">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Kitz Design System
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Component library preview — all variants and states
          </p>
        </header>

        {/* ── Buttons ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Buttons</h2>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">States</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button icon={<Plus size={16} />}>With Icon</Button>
                <Button icon={<Search size={16} />} iconOnly aria-label="Search" />
                <Button variant="danger" icon={<Trash2 size={16} />}>Delete</Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Inputs ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Inputs</h2>

          <div className="grid max-w-md gap-6">
            <Input
              label="Email"
              placeholder="you@example.com"
              helpText="We will never share your email."
              type="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              required
              error={inputError || undefined}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError(e.target.value.length > 0 && e.target.value.length < 8 ? 'Password must be at least 8 characters' : '')
              }}
            />
            <Input
              label="Search"
              placeholder="Search contacts..."
              leadingIcon={<Search size={16} />}
            />
            <Input
              label="Disabled"
              value="Cannot edit"
              disabled
            />
          </div>
        </section>

        {/* ── Select ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Select</h2>

          <div className="grid max-w-md gap-6">
            <Select
              label="Pipeline Stage"
              placeholder="Select stage..."
              options={[
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'proposal', label: 'Proposal' },
                { value: 'won', label: 'Won' },
              ]}
              helpText="Current stage in the sales pipeline"
            />
            <Select
              label="Priority"
              error="Priority is required"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
        </section>

        {/* ── Badges ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Badges</h2>

          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Paid</Badge>
            <Badge variant="error">Overdue</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="success" size="sm">SM</Badge>
            <Badge variant="primary" size="sm">SM</Badge>
          </div>
        </section>

        {/* ── Cards ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Cards</h2>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Default Card" />
              <CardBody>
                <p className="text-sm text-gray-600">Basic card with border styling.</p>
              </CardBody>
            </Card>

            <Card variant="elevated">
              <CardHeader title="Elevated Card" action={<Badge variant="success">Active</Badge>} />
              <CardBody>
                <p className="text-sm text-gray-600">Shadow-based elevation.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm" variant="ghost">View Details</Button>
              </CardFooter>
            </Card>

            <Card variant="interactive">
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-purple-100 text-purple-600">
                    <Settings size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Interactive Card</p>
                    <p className="text-xs text-gray-500">Hover for shadow effect</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* ── Table ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Table</h2>

          <Card>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead sortable sortDirection="asc">Name</TableHead>
                  <TableHead sortable sortDirection={null}>Email</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead sortable sortDirection={null}>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-900">Maria Garcia</TableCell>
                  <TableCell>maria@example.com</TableCell>
                  <TableCell><Badge variant="primary">Qualified</Badge></TableCell>
                  <TableCell>$2,400</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">View</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-900">John Smith</TableCell>
                  <TableCell>john@company.co</TableCell>
                  <TableCell><Badge variant="success">Won</Badge></TableCell>
                  <TableCell>$8,500</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">View</Button>
                  </TableCell>
                </TableRow>
                <TableRow selected>
                  <TableCell className="font-medium text-gray-900">Ana Rodriguez</TableCell>
                  <TableCell>ana@startup.io</TableCell>
                  <TableCell><Badge variant="warning">Proposal</Badge></TableCell>
                  <TableCell>$1,200</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">View</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <h3 className="mb-3 mt-8 text-sm font-medium text-gray-700">Empty Table</h3>
          <Card>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Stage</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  colSpan={3}
                  icon={<Users size={40} />}
                  title="No leads yet"
                  description="Import contacts or create your first lead to get started."
                  action={<Button size="sm" icon={<Plus size={14} />}>Create Lead</Button>}
                />
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* ── Modal ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Modal</h2>

          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>

          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <ModalHeader title="Create New Lead" onClose={() => setModalOpen(false)} />
            <ModalBody>
              <div className="space-y-4">
                <Input label="Full Name" placeholder="Maria Garcia" required />
                <Input label="Email" placeholder="maria@example.com" type="email" />
                <Input label="Company" placeholder="Acme Corp" />
                <Select
                  label="Stage"
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'qualified', label: 'Qualified' },
                  ]}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button>Create Lead</Button>
            </ModalFooter>
          </Modal>
        </section>

        {/* ── Empty State ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Empty States</h2>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <EmptyState
                icon={<Package size={40} />}
                title="No orders yet"
                description="Orders will appear here when customers make purchases."
                action={<Button size="sm">Create Order</Button>}
              />
            </Card>

            <Card>
              <EmptyState
                icon={<Mail size={40} />}
                title="Inbox is empty"
                description="New messages from WhatsApp, email, and SMS will show up here."
              />
            </Card>
          </div>
        </section>

        {/* ── Color Palette ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Color Palette</h2>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Brand (Purple)</p>
              <div className="flex gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex flex-col items-center gap-1">
                    <div
                      className="h-12 w-12 rounded-[var(--radius-md)]"
                      style={{ backgroundColor: `var(--color-purple-${shade})` }}
                    />
                    <span className="text-[10px] text-gray-500">{shade}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Semantic</p>
              <div className="flex gap-3">
                {[
                  { label: 'Success', color: 'var(--color-success)' },
                  { label: 'Error', color: 'var(--color-error)' },
                  { label: 'Warning', color: 'var(--color-warning)' },
                  { label: 'Info', color: 'var(--color-info)' },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs text-gray-600">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Typography ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Typography</h2>

          <div className="space-y-4">
            <div><span className="text-4xl font-bold text-gray-900">Display — 36px Bold</span></div>
            <div><span className="text-3xl font-bold text-gray-900">Heading 1 — 30px Bold</span></div>
            <div><span className="text-2xl font-semibold text-gray-900">Heading 2 — 24px Semibold</span></div>
            <div><span className="text-xl font-semibold text-gray-900">Heading 3 — 20px Semibold</span></div>
            <div><span className="text-base font-medium text-gray-900">Heading 4 — 16px Medium</span></div>
            <div><span className="text-sm text-gray-700">Body — 14px Regular</span></div>
            <div><span className="text-[13px] text-gray-500">Small — 13px (secondary text)</span></div>
            <div><span className="text-xs text-gray-400">Extra Small — 12px (captions, metadata)</span></div>
            <div><span className="text-[11px] text-gray-400">XXS — 11px (fine print, badges)</span></div>
          </div>
        </section>

        {/* ── Spacing ── */}
        <section>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Spacing Scale (4px base)</h2>

          <div className="flex items-end gap-2">
            {[
              { label: '4', px: 4 },
              { label: '8', px: 8 },
              { label: '12', px: 12 },
              { label: '16', px: 16 },
              { label: '20', px: 20 },
              { label: '24', px: 24 },
              { label: '32', px: 32 },
              { label: '40', px: 40 },
              { label: '48', px: 48 },
              { label: '64', px: 64 },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-4 bg-purple-500 rounded-sm"
                  style={{ height: s.px }}
                />
                <span className="text-[10px] text-gray-400">{s.px}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
