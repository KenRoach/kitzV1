/**
 * RenewFlow Tool Handlers
 *
 * Registered tools for the RenewFlow warranty renewal platform.
 * Data persistence: NDJSON files in data/ directory, keyed by org_id.
 *
 * Business flow: VAR -> RenewFlow -> Delivery Partner (and back)
 */

import { randomUUID } from 'node:crypto';
import { appendFile, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendQuoteEmail, type QuoteEmailData } from './email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data', 'renewflow');

// ─── Types ───

interface Asset {
  id: string;
  brand: string;
  model: string;
  serial: string;
  client: string;
  tier: 'critical' | 'standard' | 'low-use' | 'eol';
  daysLeft: number;
  oem: number | null;
  tpm: number;
  status: string;
  warrantyEnd?: string;
  deviceType?: string;
  purchaseDate?: string;
  quantity?: number;
  orgId: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  client: string;
  quoteRef: string;
  items: unknown[];
  status: string;
  total: number;
  created: string;
  updated: string;
  vendorPO?: string;
  deliveryPartner?: string;
  notes?: string;
  orgId: string;
}

interface SupportTicket {
  id: string;
  client: string;
  device: string;
  issue: string;
  status: string;
  priority: string;
  created: string;
  assignee: string;
  orgId: string;
}

interface RewardsProfile {
  orgId: string;
  points: number;
  level: string;
  nextLevel: string;
  nextAt: number;
  history: { action: string; pts: number; date: string }[];
}

// ─── NDJSON Persistence Helpers ───

async function ensureDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

async function readNdjson<T>(filename: string): Promise<T[]> {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) return [];
  try {
    const raw = await readFile(filepath, 'utf-8');
    return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as T);
  } catch { return []; }
}

async function appendNdjson<T>(filename: string, record: T): Promise<void> {
  await ensureDir();
  await appendFile(join(DATA_DIR, filename), JSON.stringify(record) + '\n', 'utf-8');
}

async function writeNdjson<T>(filename: string, records: T[]): Promise<void> {
  await ensureDir();
  const content = records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
  await writeFile(join(DATA_DIR, filename), content, 'utf-8');
}

// ─── Seed Data (used when org has no data yet) ───

function seedAssets(orgId: string): Asset[] {
  return [
    { id: 'A-1001', brand: 'Dell', model: 'PowerEdge R760', serial: 'SVRTG7X3', client: 'Grupo Alfa', tier: 'critical', daysLeft: 7, oem: 4890, tpm: 2450, status: 'alerted-7', deviceType: 'Server', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1002', brand: 'HPE', model: 'ProLiant DL380 Gen11', serial: 'SVR2K9M1', client: 'Rex Distribution', tier: 'critical', daysLeft: 14, oem: 5200, tpm: 2680, status: 'alerted-14', deviceType: 'Server', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1003', brand: 'NetApp', model: 'AFF A250', serial: 'NAS8R2P4', client: 'Banco del Pacífico', tier: 'critical', daysLeft: 28, oem: 12800, tpm: 6400, status: 'alerted-30', deviceType: 'Storage', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1004', brand: 'Cisco', model: 'Catalyst 9300-48P', serial: 'NET5N8Q2', client: 'Grupo Alfa', tier: 'standard', daysLeft: 45, oem: 1890, tpm: 945, status: 'alerted-90', deviceType: 'Network Switch', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1005', brand: 'Dell', model: 'PowerStore 1200T', serial: 'STO7T3K2', client: 'Beta Investments', tier: 'critical', daysLeft: 60, oem: 18500, tpm: 9250, status: 'alerted-60', deviceType: 'Storage', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1006', brand: 'Lenovo', model: 'ThinkSystem SR650 V3', serial: 'SVRP4X1', client: 'TechSoluciones', tier: 'standard', daysLeft: 88, oem: 3200, tpm: 1600, status: 'alerted-90', deviceType: 'Server', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1007', brand: 'HPE', model: 'Nimble Storage HF40', serial: 'STO2W9K', client: 'Banco del Pacífico', tier: 'critical', daysLeft: 22, oem: 22400, tpm: 11200, status: 'quoted', deviceType: 'Storage', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1008', brand: 'Fortinet', model: 'FortiGate 200F', serial: 'FW5N1R7', client: 'Grupo Alfa', tier: 'critical', daysLeft: -15, oem: null, tpm: 3200, status: 'lapsed', deviceType: 'Firewall', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1009', brand: 'Cisco', model: 'UCS C240 M7', serial: 'SVR9K4P1', client: 'Rex Distribution', tier: 'critical', daysLeft: 12, oem: 6800, tpm: 3400, status: 'alerted-14', deviceType: 'Server', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1010', brand: 'Dell', model: 'PowerEdge R660', serial: 'SVRM3N7', client: 'TechSoluciones', tier: 'standard', daysLeft: 35, oem: 3600, tpm: 1800, status: 'alerted-60', deviceType: 'Server', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1011', brand: 'Pure Storage', model: 'FlashArray//X50 R4', serial: 'PSAN2Q8', client: 'Beta Investments', tier: 'critical', daysLeft: 19, oem: 28000, tpm: 14000, status: 'quoted', deviceType: 'Storage', orgId, createdAt: new Date().toISOString() },
    { id: 'A-1012', brand: 'Palo Alto', model: 'PA-3260', serial: 'FW8R5T3', client: 'Banco del Pacífico', tier: 'critical', daysLeft: 52, oem: 8900, tpm: 4450, status: 'alerted-60', deviceType: 'Firewall', orgId, createdAt: new Date().toISOString() },
  ];
}

function seedOrders(orgId: string): PurchaseOrder[] {
  return [
    { id: 'PO-3001', client: 'Grupo Alfa', quoteRef: 'Q-5001', status: 'approved', total: 7350, created: 'Mar 11', updated: 'Mar 11', vendorPO: 'GA-2026-0042', deliveryPartner: 'ServiceNet LATAM', items: [{ assetId: 'A-1001', brand: 'Dell', model: 'PowerEdge R760', serial: 'SVRTG7X3', coverageType: 'tpm', price: 2450, quantity: 3 }], orgId },
    { id: 'PO-3002', client: 'Rex Distribution', quoteRef: 'Q-5002', status: 'pending-approval', total: 5360, created: 'Mar 10', updated: 'Mar 10', items: [{ assetId: 'A-1002', brand: 'HPE', model: 'ProLiant DL380 Gen11', serial: 'SVR2K9M1', coverageType: 'tpm', price: 2680, quantity: 2 }], orgId },
    { id: 'PO-3003', client: 'Banco del Pacífico', quoteRef: 'Q-5003', status: 'draft', total: 22400, created: 'Mar 9', updated: 'Mar 9', items: [{ assetId: 'A-1007', brand: 'HPE', model: 'Nimble Storage HF40', serial: 'STO2W9K', coverageType: 'oem', price: 22400, quantity: 1 }], orgId },
    { id: 'PO-3004', client: 'Beta Investments', quoteRef: 'Q-5004', status: 'fulfilled', total: 18500, created: 'Mar 3', updated: 'Mar 7', vendorPO: 'BI-2026-0018', deliveryPartner: 'Evernex LATAM', items: [{ assetId: 'A-1005', brand: 'Dell', model: 'PowerStore 1200T', serial: 'STO7T3K2', coverageType: 'tpm', price: 9250, quantity: 2 }], orgId },
    { id: 'PO-3005', client: 'TechSoluciones', quoteRef: 'Q-5005', status: 'submitted', total: 6800, created: 'Mar 6', updated: 'Mar 8', vendorPO: 'TS-2026-0091', deliveryPartner: 'Park Place Technologies', items: [{ assetId: 'A-1009', brand: 'Cisco', model: 'UCS C240 M7', serial: 'SVR9K4P1', coverageType: 'tpm', price: 3400, quantity: 2 }], orgId },
  ];
}

function seedTickets(orgId: string): SupportTicket[] {
  return [
    { id: 'T-2001', client: 'Grupo Alfa', device: 'Dell PowerEdge R760', issue: 'RAID controller failure — degraded array on production DB server', status: 'open', priority: 'critical', created: 'Mar 11', assignee: 'ServiceNet LATAM', orgId },
    { id: 'T-2002', client: 'Banco del Pacífico', device: 'NetApp AFF A250', issue: 'Disk shelf offline — intermittent SAS connectivity', status: 'in-progress', priority: 'high', created: 'Mar 10', assignee: 'Evernex LATAM', orgId },
    { id: 'T-2003', client: 'Rex Distribution', device: 'HPE ProLiant DL380 Gen11', issue: 'PSU redundancy lost — replace failed power supply', status: 'resolved', priority: 'medium', created: 'Mar 8', assignee: 'Park Place Technologies', orgId },
    { id: 'T-2004', client: 'Beta Investments', device: 'Dell PowerStore 1200T', issue: 'Firmware update failed — storage controller unresponsive', status: 'escalated', priority: 'critical', created: 'Mar 7', assignee: 'Dell ProSupport', orgId },
    { id: 'T-2005', client: 'Grupo Alfa', device: 'Fortinet FortiGate 200F', issue: 'HA failover not triggering — secondary unit out of sync', status: 'open', priority: 'high', created: 'Mar 6', assignee: 'Fortinet TAC', orgId },
    { id: 'T-2006', client: 'TechSoluciones', device: 'Cisco Catalyst 9300-48P', issue: 'PoE ports not powering APs after IOS upgrade', status: 'in-progress', priority: 'medium', created: 'Mar 5', assignee: 'Cisco TAC', orgId },
  ];
}

function seedRewards(orgId: string): RewardsProfile {
  return {
    orgId,
    points: 8250,
    level: 'Platinum',
    nextLevel: 'Platinum',
    nextAt: 15000,
    history: [
      { action: 'Server fleet renewal — Grupo Alfa (3x PowerEdge R760)', pts: 750, date: 'Mar 10' },
      { action: 'Storage array coverage — Banco del Pacífico (NetApp AFF A250)', pts: 500, date: 'Mar 9' },
      { action: 'Referral: TechSoluciones signed up', pts: 500, date: 'Mar 8' },
      { action: 'Enterprise quote sent — Rex Distribution (HPE DL380 fleet)', pts: 100, date: 'Mar 7' },
      { action: 'PowerStore 1200T renewal closed — Beta Investments', pts: 500, date: 'Mar 6' },
      { action: 'Firewall coverage — Grupo Alfa (FortiGate 200F)', pts: 250, date: 'Mar 5' },
      { action: 'Multi-vendor PO submitted — TechSoluciones (Cisco UCS)', pts: 150, date: 'Mar 4' },
      { action: '7-day daily usage streak', pts: 100, date: 'Mar 2' },
    ],
  };
}

// ─── Data Access (per-org) ───

async function getAssets(orgId: string): Promise<Asset[]> {
  const file = `assets-${orgId}.ndjson`;
  let assets = await readNdjson<Asset>(file);
  if (assets.length === 0) {
    // Seed default data for new orgs
    assets = seedAssets(orgId);
    await writeNdjson(file, assets);
  }
  return assets;
}

async function getOrders(orgId: string): Promise<PurchaseOrder[]> {
  const file = `orders-${orgId}.ndjson`;
  let orders = await readNdjson<PurchaseOrder>(file);
  if (orders.length === 0) {
    orders = seedOrders(orgId);
    await writeNdjson(file, orders);
  }
  return orders;
}

async function getTickets(orgId: string): Promise<SupportTicket[]> {
  const file = `tickets-${orgId}.ndjson`;
  let tickets = await readNdjson<SupportTicket>(file);
  if (tickets.length === 0) {
    tickets = seedTickets(orgId);
    await writeNdjson(file, tickets);
  }
  return tickets;
}

async function getRewards(orgId: string): Promise<RewardsProfile> {
  const file = `rewards-${orgId}.ndjson`;
  const records = await readNdjson<RewardsProfile>(file);
  if (records.length === 0) {
    const rewards = seedRewards(orgId);
    await appendNdjson(file, rewards);
    return rewards;
  }
  return records[records.length - 1]; // Latest snapshot
}

// ─── Tool Handlers ───

type ToolHandler = (input: Record<string, unknown>, orgId: string) => Promise<unknown>;

const toolHandlers: Record<string, ToolHandler> = {
  async list_assets(_input, orgId) {
    const assets = await getAssets(orgId);
    return { assets, total: assets.length };
  },

  async add_assets(input, orgId) {
    const newAssets = (input.assets || []) as Partial<Asset>[];
    const file = `assets-${orgId}.ndjson`;
    const existing = await getAssets(orgId);
    const added: Asset[] = [];

    for (const a of newAssets) {
      const asset: Asset = {
        id: a.id || `IMP-${1000 + existing.length + added.length}`,
        brand: String(a.brand || 'Unknown'),
        model: String(a.model || 'Unknown'),
        serial: String(a.serial || `UNK-${added.length}`),
        client: String(a.client || 'Unassigned'),
        tier: (a.tier as Asset['tier']) || 'standard',
        daysLeft: typeof a.daysLeft === 'number' ? a.daysLeft : 90,
        oem: typeof a.oem === 'number' ? a.oem : null,
        tpm: typeof a.tpm === 'number' ? a.tpm : 99,
        status: String(a.status || 'discovered'),
        warrantyEnd: a.warrantyEnd,
        deviceType: a.deviceType,
        purchaseDate: a.purchaseDate,
        quantity: typeof a.quantity === 'number' ? a.quantity : 1,
        orgId,
        createdAt: new Date().toISOString(),
      };
      added.push(asset);
    }

    const all = [...existing, ...added];
    await writeNdjson(file, all);
    return { added: added.length, total: all.length };
  },

  async get_asset_metrics(_input, orgId) {
    const assets = await getAssets(orgId);
    const totalDevices = assets.length;
    const uniqueClients = new Set(assets.map(a => a.client)).size;
    const totalOEM = assets.reduce((s, a) => s + (a.oem || 0), 0);
    const totalTPM = assets.reduce((s, a) => s + a.tpm, 0);
    const savings = totalOEM - totalTPM;
    const alertCount = assets.filter(a => a.daysLeft <= 30 && a.daysLeft >= 0).length;
    const lapsedCount = assets.filter(a => a.daysLeft < 0).length;
    const quotedCount = assets.filter(a => a.status === 'quoted').length;

    return { totalDevices, uniqueClients, totalOEM, totalTPM, savings, alertCount, lapsedCount, quotedCount };
  },

  async generate_insights(_input, orgId) {
    const assets = await getAssets(orgId);

    // Client concentration
    const clientMap: Record<string, number> = {};
    for (const a of assets) {
      clientMap[a.client] = (clientMap[a.client] || 0) + 1;
    }
    const clientConcentration = Object.entries(clientMap)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / assets.length) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Warranty expiry timeline
    const expiryBuckets = [
      { label: '0-7 days', count: assets.filter(a => a.daysLeft >= 0 && a.daysLeft <= 7).length },
      { label: '8-30 days', count: assets.filter(a => a.daysLeft > 7 && a.daysLeft <= 30).length },
      { label: '31-60 days', count: assets.filter(a => a.daysLeft > 30 && a.daysLeft <= 60).length },
      { label: '61-90 days', count: assets.filter(a => a.daysLeft > 60 && a.daysLeft <= 90).length },
      { label: 'Lapsed', count: assets.filter(a => a.daysLeft < 0).length },
    ];

    // Brand savings
    const brandMap: Record<string, { oem: number; tpm: number; count: number }> = {};
    for (const a of assets) {
      if (!brandMap[a.brand]) brandMap[a.brand] = { oem: 0, tpm: 0, count: 0 };
      brandMap[a.brand].oem += a.oem || 0;
      brandMap[a.brand].tpm += a.tpm;
      brandMap[a.brand].count++;
    }
    const brandSavings = Object.entries(brandMap)
      .map(([brand, d]) => ({ brand, oem: d.oem, tpm: d.tpm, savings: d.oem - d.tpm, count: d.count }))
      .sort((a, b) => b.savings - a.savings);

    // Tier breakdown
    const tierMap: Record<string, number> = {};
    for (const a of assets) {
      tierMap[a.tier] = (tierMap[a.tier] || 0) + 1;
    }
    const tierBreakdown = Object.entries(tierMap)
      .map(([tier, count]) => ({ tier, count, pct: Math.round((count / assets.length) * 100) }));

    return { clientConcentration, expiryBuckets, brandSavings, tierBreakdown };
  },

  async generate_quote(input, orgId) {
    const assetIds = (input.assetIds || []) as string[];
    const coverageType = (input.coverageType || 'tpm') as 'tpm' | 'oem';
    const assets = await getAssets(orgId);
    const selected = assets.filter(a => assetIds.includes(a.id));

    if (selected.length === 0) {
      return { error: 'No matching assets found for the given IDs' };
    }

    const quoteId = `Q-${5000 + Math.floor(Math.random() * 1000)}`;
    const items = selected.map(a => ({
      assetId: a.id,
      brand: a.brand,
      model: a.model,
      serial: a.serial,
      client: a.client,
      deviceType: a.deviceType || 'Unknown',
      tier: a.tier,
      daysLeft: a.daysLeft,
      tpmPrice: a.tpm,
      oemPrice: a.oem,
      selectedCoverage: coverageType,
      lineTotal: coverageType === 'oem' ? (a.oem ?? a.tpm) : a.tpm,
    }));

    const totalTPM = selected.reduce((s, a) => s + a.tpm, 0);
    const totalOEM = selected.reduce((s, a) => s + (a.oem ?? 0), 0);
    const selectedTotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const savings = totalOEM - totalTPM;
    const savingsPct = totalOEM > 0 ? Math.round((savings / totalOEM) * 100) : 0;

    // Group by client
    const clientMap: Record<string, typeof items> = {};
    for (const item of items) {
      if (!clientMap[item.client]) clientMap[item.client] = [];
      clientMap[item.client].push(item);
    }
    const clients = Object.keys(clientMap);

    return {
      quoteId,
      date: new Date().toISOString().slice(0, 10),
      coverageType,
      deviceCount: selected.length,
      clients,
      items,
      summary: {
        totalTPM,
        totalOEM,
        selectedTotal,
        savings,
        savingsPct,
      },
      status: 'generated',
    };
  },

  async generate_custom_quote(input, _orgId) {
    const items = (input.items || []) as { brand: string; model: string; deviceType: string; tier: string; quantity: number; coverageType: 'tpm' | 'oem' }[];
    const client = String(input.client || 'New Client');

    if (items.length === 0) {
      return { error: 'At least one line item is required' };
    }

    // Device catalog pricing (realistic LATAM channel pricing)
    const CATALOG: Record<string, Record<string, { oem: number; tpm: number }>> = {
      Dell: {
        'PowerEdge R760': { oem: 4890, tpm: 2450 },
        'PowerEdge R660': { oem: 3600, tpm: 1800 },
        'PowerEdge R760xs': { oem: 4200, tpm: 2100 },
        'PowerStore 1200T': { oem: 18500, tpm: 9250 },
        'PowerStore 500T': { oem: 12000, tpm: 6000 },
        'PowerSwitch S5248F': { oem: 2800, tpm: 1400 },
        'Latitude 5540': { oem: 450, tpm: 225 },
        'OptiPlex 7010': { oem: 380, tpm: 190 },
        'Precision 7680': { oem: 890, tpm: 445 },
      },
      HPE: {
        'ProLiant DL380 Gen11': { oem: 5200, tpm: 2680 },
        'ProLiant DL360 Gen11': { oem: 4600, tpm: 2300 },
        'ProLiant DL380 Gen10 Plus': { oem: 3800, tpm: 1900 },
        'Nimble Storage HF40': { oem: 22400, tpm: 11200 },
        'Nimble Storage HF20': { oem: 14200, tpm: 7100 },
        'Aruba 6300F': { oem: 3100, tpm: 1550 },
        'Aruba CX 8360': { oem: 5400, tpm: 2700 },
      },
      Cisco: {
        'Catalyst 9300-48P': { oem: 1890, tpm: 945 },
        'Catalyst 9200-48P': { oem: 1400, tpm: 700 },
        'Catalyst 9500-32C': { oem: 6200, tpm: 3100 },
        'UCS C240 M7': { oem: 6800, tpm: 3400 },
        'UCS C220 M7': { oem: 5200, tpm: 2600 },
        'ISR 4461': { oem: 4200, tpm: 2100 },
        'Nexus 9336C-FX2': { oem: 8500, tpm: 4250 },
      },
      Lenovo: {
        'ThinkSystem SR650 V3': { oem: 3200, tpm: 1600 },
        'ThinkSystem SR630 V3': { oem: 2800, tpm: 1400 },
        'ThinkSystem DE6000H': { oem: 16000, tpm: 8000 },
        'ThinkAgile MX1021': { oem: 9500, tpm: 4750 },
        'ThinkPad T14s Gen 4': { oem: 520, tpm: 260 },
      },
      NetApp: {
        'AFF A250': { oem: 12800, tpm: 6400 },
        'AFF A400': { oem: 22000, tpm: 11000 },
        'AFF C250': { oem: 9800, tpm: 4900 },
        'FAS2820': { oem: 7600, tpm: 3800 },
      },
      Fortinet: {
        'FortiGate 200F': { oem: 6400, tpm: 3200 },
        'FortiGate 100F': { oem: 3800, tpm: 1900 },
        'FortiGate 60F': { oem: 1200, tpm: 600 },
        'FortiSwitch 248E-FPOE': { oem: 2400, tpm: 1200 },
        'FortiAP 231G': { oem: 800, tpm: 400 },
      },
      'Palo Alto': {
        'PA-3260': { oem: 8900, tpm: 4450 },
        'PA-850': { oem: 5200, tpm: 2600 },
        'PA-460': { oem: 2800, tpm: 1400 },
        'PA-220': { oem: 1200, tpm: 600 },
      },
      'Pure Storage': {
        'FlashArray//X50 R4': { oem: 28000, tpm: 14000 },
        'FlashArray//X20 R4': { oem: 18000, tpm: 9000 },
        'FlashArray//C40': { oem: 22000, tpm: 11000 },
        'FlashBlade//S200': { oem: 35000, tpm: 17500 },
      },
      Juniper: {
        'EX4400-48T': { oem: 3200, tpm: 1600 },
        'SRX4600': { oem: 12000, tpm: 6000 },
        'QFX5120-48T': { oem: 7200, tpm: 3600 },
        'MX204': { oem: 9000, tpm: 4500 },
      },
      APC: {
        'Smart-UPS SRT 10kVA': { oem: 4800, tpm: 2400 },
        'Smart-UPS SRT 5kVA': { oem: 2600, tpm: 1300 },
        'Symmetra PX 40kW': { oem: 12000, tpm: 6000 },
        'NetShelter SX 42U': { oem: 800, tpm: 400 },
      },
    };

    const quoteId = `Q-${5000 + Math.floor(Math.random() * 1000)}`;
    const quoteItems = items.map((item, idx) => {
      const brandCatalog = CATALOG[item.brand] || {};
      const pricing = brandCatalog[item.model] || { oem: 1000, tpm: 500 }; // Fallback
      const lineTotal = item.coverageType === 'oem'
        ? pricing.oem * item.quantity
        : pricing.tpm * item.quantity;

      return {
        assetId: `NEW-${idx + 1}`,
        brand: item.brand,
        model: item.model,
        serial: 'TBD',
        client,
        deviceType: item.deviceType,
        tier: item.tier,
        daysLeft: 0,
        tpmPrice: pricing.tpm * item.quantity,
        oemPrice: pricing.oem * item.quantity,
        selectedCoverage: item.coverageType,
        lineTotal,
      };
    });

    const totalTPM = quoteItems.reduce((s, i) => s + i.tpmPrice, 0);
    const totalOEM = quoteItems.reduce((s, i) => s + (i.oemPrice ?? 0), 0);
    const selectedTotal = quoteItems.reduce((s, i) => s + i.lineTotal, 0);
    const savings = totalOEM - totalTPM;
    const savingsPct = totalOEM > 0 ? Math.round((savings / totalOEM) * 100) : 0;

    return {
      quoteId,
      date: new Date().toISOString().slice(0, 10),
      coverageType: items[0]?.coverageType || 'tpm',
      deviceCount: items.reduce((s, i) => s + i.quantity, 0),
      clients: [client],
      items: quoteItems,
      summary: { totalTPM, totalOEM, selectedTotal, savings, savingsPct },
      status: 'generated',
    };
  },

  async list_orders(_input, orgId) {
    const orders = await getOrders(orgId);
    return { orders, total: orders.length };
  },

  async create_order(input, orgId) {
    const order = input.order as Partial<PurchaseOrder>;
    const file = `orders-${orgId}.ndjson`;
    const existing = await getOrders(orgId);

    const newOrder: PurchaseOrder = {
      id: `PO-${3000 + existing.length + 1}`,
      client: String(order.client || 'Unknown'),
      quoteRef: String(order.quoteRef || ''),
      items: (order.items || []) as unknown[],
      status: 'draft',
      total: typeof order.total === 'number' ? order.total : 0,
      created: new Date().toISOString().slice(0, 10),
      updated: new Date().toISOString().slice(0, 10),
      orgId,
    };

    const all = [...existing, newOrder];
    await writeNdjson(file, all);
    return { orderId: newOrder.id, status: newOrder.status };
  },

  async list_tickets(_input, orgId) {
    const tickets = await getTickets(orgId);
    return { tickets, total: tickets.length };
  },

  async get_rewards(_input, orgId) {
    return getRewards(orgId);
  },

  async ai_chat(input, orgId) {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
    if (!ANTHROPIC_API_KEY) {
      return { reply: 'AI chat is not configured on this server.' };
    }

    const userMessage = String(input.message || '');
    const history = (input.history || []) as { role: string; text: string }[];

    if (!userMessage.trim()) {
      return { reply: 'Please enter a message.' };
    }

    // Input length validation (enterprise security)
    if (userMessage.length > 4000) {
      return { reply: 'Message is too long. Please keep it under 4000 characters.' };
    }

    // Load org context for AI — assets, orders, tickets
    const assets = await getAssets(orgId);
    const orders = await getOrders(orgId);
    const tickets = await getTickets(orgId);

    const criticalAssets = assets.filter(a => a.daysLeft <= 30 && a.daysLeft >= 0);
    const lapsedAssets = assets.filter(a => a.daysLeft < 0);
    const totalPortfolio = assets.reduce((s, a) => s + a.tpm, 0);
    const clients = [...new Set(assets.map(a => a.client))];

    const systemPrompt = `You are RenewFlow AI — the intelligent warranty renewal assistant for LATAM IT channel partners. You have access to this organization's real data.

PORTFOLIO SUMMARY:
- ${assets.length} total devices across ${clients.length} clients: ${clients.join(', ')}
- ${criticalAssets.length} devices expiring within 30 days (URGENT)
- ${lapsedAssets.length} lapsed warranties needing recovery
- Total TPM portfolio value: $${totalPortfolio.toLocaleString()}

CRITICAL DEVICES (expiring ≤30 days):
${criticalAssets.slice(0, 8).map(a => `  • ${a.brand} ${a.model} (${a.client}) — ${a.daysLeft} days left, TPM: $${a.tpm}, OEM: $${a.oem ?? 'N/A'}`).join('\n') || '  None'}

LAPSED WARRANTIES:
${lapsedAssets.slice(0, 5).map(a => `  • ${a.brand} ${a.model} (${a.client}) — ${Math.abs(a.daysLeft)} days expired, TPM recovery: $${a.tpm}`).join('\n') || '  None'}

OPEN ORDERS: ${orders.filter(o => o.status !== 'fulfilled').length} pending
OPEN TICKETS: ${tickets.filter(t => t.status !== 'resolved').length} active

RULES:
- Always present TPM first for Standard/Low-use tiers (30-60% savings over OEM)
- Recommend OEM first for Critical tier devices
- Communication is email-only (no WhatsApp or messaging)
- Be concise (max 200 words). Use data from the portfolio above.
- If asked about specific devices or clients, reference actual data.`;

    // Build messages for Anthropic API
    const apiMessages = [
      ...history
        .filter(m => m.role !== 'system')
        .slice(-10) // Keep last 10 messages for context window management
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
          content: m.text,
        })),
      { role: 'user' as const, content: userMessage },
    ];

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error('[kitz-gateway] anthropic_api_error', res.status, errBody);
        return { reply: 'AI service temporarily unavailable. Please try again.' };
      }

      const data = await res.json() as { content?: { type: string; text: string }[] };
      const reply = data.content
        ?.filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n') || 'Unable to generate a response.';

      return { reply };
    } catch (err) {
      console.error('[kitz-gateway] anthropic_request_failed', (err as Error).message);
      return { reply: 'AI service timed out. Please try again.' };
    }
  },

  async send_quote_email(input, _orgId) {
    const recipients = (input.recipients || []) as string[];
    const quoteData = input.quote as Record<string, unknown> | undefined;

    if (!recipients.length || !quoteData) {
      return { error: 'recipients and quote data are required' };
    }

    // Validate email format
    const validEmails = recipients.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (validEmails.length === 0) {
      return { error: 'No valid email addresses provided' };
    }

    const items = ((quoteData.items || []) as Record<string, unknown>[]).map(i => ({
      brand: String(i.brand || ''),
      model: String(i.model || ''),
      coverage: String(i.selectedCoverage || i.coverage || 'tpm'),
      price: typeof i.lineTotal === 'number' ? i.lineTotal : 0,
    }));

    const summary = (quoteData.summary || {}) as Record<string, number>;

    const emailData: QuoteEmailData = {
      quoteId: String(quoteData.quoteId || ''),
      date: String(quoteData.date || new Date().toISOString().slice(0, 10)),
      clientName: ((quoteData.clients || []) as string[])[0] || 'Client',
      coverageType: String(quoteData.coverageType || 'tpm'),
      deviceCount: typeof quoteData.deviceCount === 'number' ? quoteData.deviceCount : items.length,
      totalAmount: summary.selectedTotal || 0,
      savings: summary.savings || 0,
      savingsPct: summary.savingsPct || 0,
      items,
      senderName: String(input.senderName || 'RenewFlow User'),
      senderEmail: String(input.senderEmail || 'noreply@renewflow.io'),
    };

    const result = await sendQuoteEmail(validEmails, emailData);
    return { success: true, ...result, quoteId: emailData.quoteId };
  },
};

// ─── Role-based Tool Permissions ───

type UserRole = 'var' | 'support' | 'delivery-partner';

const TOOL_PERMISSIONS: Record<string, UserRole[]> = {
  list_assets:       ['var', 'support', 'delivery-partner'],
  add_assets:        ['var', 'support'],
  get_asset_metrics: ['var', 'support'],
  generate_insights: ['var', 'support'],
  generate_quote:    ['var', 'support'],
  generate_custom_quote: ['var', 'support'],
  list_orders:       ['var', 'support', 'delivery-partner'],
  create_order:      ['var'],
  list_tickets:      ['var', 'support', 'delivery-partner'],
  get_rewards:       ['var', 'support'],
  send_quote_email:  ['var', 'support', 'delivery-partner'],
  ai_chat:           ['var', 'support', 'delivery-partner'],
};

// ─── Router ───

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
  orgId: string,
  userRole?: string,
): Promise<{ handled: boolean; output?: unknown }> {
  const handler = toolHandlers[name];
  if (!handler) return { handled: false };

  // Check role-based permissions
  const role = (userRole || 'var') as UserRole;
  const allowedRoles = TOOL_PERMISSIONS[name];
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { handled: true, output: { error: `Access denied: ${name} is not available for ${role} role` } };
  }

  const output = await handler(input, orgId);
  return { handled: true, output };
}
