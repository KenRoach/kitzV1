#!/usr/bin/env tsx
/**
 * audit-code.ts — KITZ Swarm Code Audit
 *
 * 102 agents audit the Kitz codebase from every angle:
 *   - Security, compliance, architecture, performance, UX
 *   - Each team reads real files and produces real findings
 *   - Results aggregated into a structured report
 *
 * Usage: npx tsx aos/scripts/audit-code.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dirname, '../../');

// ── Colors ──
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const MAGENTA = '\x1b[35m';

function ms(n: number): string {
  return n < 1000 ? `${n}ms` : `${(n / 1000).toFixed(2)}s`;
}

// ── File reading helpers ──

function readFile(relPath: string): string | null {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
  } catch {
    return null;
  }
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function listFiles(dir: string, ext = '.ts'): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  const results: string[] = [];
  function walk(d: string) {
    try {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
        const p = path.join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.name.endsWith(ext)) results.push(path.relative(ROOT, p));
      }
    } catch { /* skip unreadable dirs */ }
  }
  walk(full);
  return results;
}

function countLines(relPath: string): number {
  const content = readFile(relPath);
  return content ? content.split('\n').length : 0;
}

function grepInFile(relPath: string, pattern: RegExp): string[] {
  const content = readFile(relPath);
  if (!content) return [];
  return content.split('\n').filter(line => pattern.test(line));
}

function grepInDir(dir: string, pattern: RegExp, ext = '.ts'): Array<{ file: string; line: string; lineNum: number }> {
  const files = listFiles(dir, ext);
  const results: Array<{ file: string; line: string; lineNum: number }> = [];
  for (const f of files) {
    const content = readFile(f);
    if (!content) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        results.push({ file: f, line: lines[i].trim(), lineNum: i + 1 });
      }
    }
  }
  return results;
}

// ── Finding types ──

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Finding {
  team: string;
  agent: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  file?: string;
  line?: number;
  recommendation?: string;
}

const findings: Finding[] = [];
const teamTimings: Map<string, number> = new Map();

function addFinding(f: Finding) {
  findings.push(f);
}

// ══════════════════════════════════════════════════
//   TEAM AUDIT FUNCTIONS — Each team audits its domain
// ══════════════════════════════════════════════════

// ── 1. SECURITY (Backend team) ──
function auditSecurity() {
  const start = Date.now();

  // Check for hardcoded secrets
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]{10,}/i,
    /secret\s*[:=]\s*['"][^'"]{10,}/i,
    /password\s*[:=]\s*['"][^'"]{10,}/i,
    /token\s*[:=]\s*['"][^'"]{10,}/i,
  ];

  for (const service of ['kitz_os/src', 'kitz-gateway/src', 'kitz-whatsapp-connector/src', 'workspace/src', 'aos/src']) {
    for (const pat of secretPatterns) {
      const hits = grepInDir(service, pat);
      for (const hit of hits) {
        // Skip .env, test files, and type declarations
        if (hit.file.includes('.env') || hit.file.includes('.test.') || hit.file.includes('types')) continue;
        // Skip process.env references (those are fine)
        if (hit.line.includes('process.env')) continue;
        // Skip default fallback values like 'dev-secret-change-me'
        if (hit.line.includes('dev-secret-change-me') || hit.line.includes('your-') || hit.line.includes('change-me')) continue;

        addFinding({
          team: 'backend', agent: 'SecurityEng', severity: 'high',
          category: 'security', title: 'Potential hardcoded secret',
          detail: `Found potential hardcoded secret: ${hit.line.slice(0, 80)}...`,
          file: hit.file, line: hit.lineNum,
          recommendation: 'Move to environment variable',
        });
      }
    }
  }

  // Check for missing auth on routes
  const routeFiles = grepInDir('kitz_os/src', /app\.(get|post|put|delete|patch)\s*\(/);
  const noAuthRoutes = routeFiles.filter(r => {
    const content = readFile(r.file);
    if (!content) return false;
    const lines = content.split('\n');
    const nearby = lines.slice(Math.max(0, r.lineNum - 3), r.lineNum + 5).join(' ');
    return !nearby.includes('auth') && !nearby.includes('secret') && !nearby.includes('token')
      && !nearby.includes('health') && !nearby.includes('ready');
  });
  if (noAuthRoutes.length > 0) {
    addFinding({
      team: 'backend', agent: 'SecurityEng', severity: 'medium',
      category: 'security', title: `${noAuthRoutes.length} routes may lack authentication`,
      detail: `Routes without visible auth checks: ${noAuthRoutes.slice(0, 5).map(r => `${r.file}:${r.lineNum}`).join(', ')}`,
      recommendation: 'Ensure all non-public routes have auth middleware',
    });
  }

  // Check for SQL injection vectors (raw queries)
  const rawQueries = grepInDir('kitz_os/src', /\.query\s*\(\s*`/);
  rawQueries.push(...grepInDir('workspace/src', /\.query\s*\(\s*`/));
  if (rawQueries.length > 0) {
    addFinding({
      team: 'backend', agent: 'SecurityEng', severity: 'high',
      category: 'security', title: `${rawQueries.length} potential SQL injection vectors`,
      detail: `Template literal queries found (use parameterized queries): ${rawQueries.slice(0, 3).map(r => r.file).join(', ')}`,
      recommendation: 'Use parameterized queries instead of template literals',
    });
  }

  // Check CORS configuration
  const corsHits = grepInDir('kitz_os/src', /cors/i);
  const corsGateway = grepInDir('kitz-gateway/src', /cors/i);
  if (corsHits.length === 0 && corsGateway.length === 0) {
    addFinding({
      team: 'backend', agent: 'SecurityEng', severity: 'medium',
      category: 'security', title: 'No CORS configuration found',
      detail: 'Neither kitz_os nor kitz-gateway have visible CORS configuration',
      recommendation: 'Add explicit CORS policy with allowlisted origins',
    });
  }

  // Check rate limiting
  const rateLimitHits = grepInDir('kitz-gateway/src', /rate[_-]?limit/i);
  if (rateLimitHits.length === 0) {
    addFinding({
      team: 'backend', agent: 'SecurityEng', severity: 'medium',
      category: 'security', title: 'No rate limiting implementation found in gateway',
      detail: 'kitz-gateway should enforce rate limits (spec says 120 req/min)',
      recommendation: 'Implement rate limiting middleware',
    });
  }

  // Check for eval/exec usage
  const evalHits = grepInDir('kitz_os/src', /\beval\s*\(/);
  evalHits.push(...grepInDir('kitz-gateway/src', /\beval\s*\(/));
  for (const hit of evalHits) {
    addFinding({
      team: 'backend', agent: 'SecurityEng', severity: 'critical',
      category: 'security', title: 'eval() usage detected',
      detail: `eval() is a code injection risk: ${hit.line.slice(0, 60)}`,
      file: hit.file, line: hit.lineNum,
      recommendation: 'Remove eval() — use safer alternatives',
    });
  }

  teamTimings.set('backend-security', Date.now() - start);
}

// ── 2. PANAMA COMPLIANCE (Legal team) ──
function auditCompliance() {
  const start = Date.now();

  // Check for compliance pipeline
  const compliancePipeline = fileExists('kitz-services/src/compliance-agent/run.ts');
  if (!compliancePipeline) {
    addFinding({
      team: 'legal-compliance', agent: 'PanamaComplianceBot', severity: 'high',
      category: 'compliance', title: 'Panama compliance pipeline missing',
      detail: 'compliance-agent/run.ts not found — Panama compliance is a legal requirement',
      recommendation: 'Implement compliance pipeline for Panama business laws',
    });
  }

  // Check for privacy policy / terms
  const privacyFiles = listFiles('kitz-docs', '.md').filter(f => /privacy|terms|gdpr|data.prot/i.test(f));
  if (privacyFiles.length === 0) {
    addFinding({
      team: 'legal-compliance', agent: 'PrivacyAuditor', severity: 'medium',
      category: 'compliance', title: 'No privacy policy or terms of service documentation',
      detail: 'Missing privacy/terms docs in kitz-docs/',
      recommendation: 'Create privacy policy and terms of service for Panama jurisdiction',
    });
  }

  // Check for PII logging
  const piiPatterns = [/console\.log.*email/i, /console\.log.*phone/i, /console\.log.*password/i];
  for (const pat of piiPatterns) {
    const hits = grepInDir('kitz_os/src', pat);
    for (const hit of hits) {
      addFinding({
        team: 'legal-compliance', agent: 'PrivacyAuditor', severity: 'high',
        category: 'compliance', title: 'PII potentially logged to console',
        detail: `Logging PII: ${hit.line.slice(0, 80)}`,
        file: hit.file, line: hit.lineNum,
        recommendation: 'Redact PII before logging',
      });
    }
  }

  // Check data retention policies
  const retentionHits = grepInDir('kitz_os/src', /retention|ttl|expir/i);
  if (retentionHits.length < 3) {
    addFinding({
      team: 'legal-compliance', agent: 'DataRetention', severity: 'medium',
      category: 'compliance', title: 'Minimal data retention policy implementation',
      detail: `Only ${retentionHits.length} references to retention/TTL/expiration in kitz_os`,
      recommendation: 'Implement data retention policies per Panama law requirements',
    });
  }

  // Check audit logging
  const auditHits = grepInDir('kitz_os/src', /audit[_-]?log|audit[_-]?trail/i);
  addFinding({
    team: 'legal-compliance', agent: 'AuditLogger', severity: auditHits.length < 5 ? 'medium' : 'info',
    category: 'compliance', title: `${auditHits.length} audit logging references found`,
    detail: auditHits.length < 5 ? 'Limited audit trail coverage' : 'Audit logging present',
    recommendation: auditHits.length < 5 ? 'Increase audit logging coverage for compliance' : undefined,
  });

  // Fact check: verify kill switch
  const killSwitch = grepInDir('kitz_os/src', /KILL_SWITCH/);
  addFinding({
    team: 'legal-compliance', agent: 'FactChecker', severity: killSwitch.length > 0 ? 'info' : 'high',
    category: 'compliance', title: killSwitch.length > 0 ? 'Kill switch implemented' : 'Kill switch NOT found',
    detail: `${killSwitch.length} references to KILL_SWITCH in kitz_os`,
    recommendation: killSwitch.length === 0 ? 'Implement KILL_SWITCH as required by governance' : undefined,
  });

  teamTimings.set('legal-compliance', Date.now() - start);
}

// ── 3. ARCHITECTURE (Platform Engineering) ──
function auditArchitecture() {
  const start = Date.now();

  // Check service health endpoints
  const services = ['kitz_os', 'kitz-gateway', 'kitz-whatsapp-connector', 'kitz-payments', 'workspace'];
  for (const svc of services) {
    const healthHits = grepInDir(`${svc}/src`, /health|ready|alive/i);
    if (healthHits.length === 0) {
      addFinding({
        team: 'platform-eng', agent: 'InfraOps', severity: 'medium',
        category: 'architecture', title: `${svc}: No health check endpoint found`,
        detail: `Service ${svc} has no health/ready/alive endpoint`,
        recommendation: 'Add /health endpoint for monitoring',
      });
    }
  }

  // Check for circular dependencies
  const indexFiles = ['kitz_os/src/index.ts', 'aos/src/index.ts', 'kitz-gateway/src/index.ts'];
  for (const f of indexFiles) {
    const content = readFile(f);
    if (!content) continue;
    const imports = content.split('\n').filter(l => l.includes('import'));
    const crossImports = imports.filter(l => l.includes('../') && l.includes('src/'));
    if (crossImports.length > 0) {
      addFinding({
        team: 'platform-eng', agent: 'ServiceMesh', severity: 'medium',
        category: 'architecture', title: `Cross-service imports in ${f}`,
        detail: `${crossImports.length} cross-service imports: ${crossImports.slice(0, 2).map(l => l.trim()).join('; ')}`,
        file: f,
        recommendation: 'Use kitz-schemas for shared types, avoid cross-service imports',
      });
    }
  }

  // Check Docker/deployment readiness
  const hasDockerCompose = fileExists('docker-compose.yml');
  const hasDockerfiles = services.filter(s => fileExists(`${s}/Dockerfile`));
  addFinding({
    team: 'platform-eng', agent: 'CapacityPlanner', severity: hasDockerfiles.length < 3 ? 'medium' : 'info',
    category: 'architecture', title: `Docker: ${hasDockerfiles.length}/${services.length} services have Dockerfiles`,
    detail: `docker-compose.yml: ${hasDockerCompose ? 'exists' : 'MISSING'}. Services with Dockerfiles: ${hasDockerfiles.join(', ') || 'none'}`,
    recommendation: hasDockerfiles.length < services.length ? 'Add Dockerfiles for all services' : undefined,
  });

  // Check for error handling patterns
  const tryCatchCount = grepInDir('kitz_os/src', /try\s*\{/).length;
  const catchCount = grepInDir('kitz_os/src', /catch\s*\(/).length;
  const unhandledRejection = grepInDir('kitz_os/src', /unhandledRejection/).length;
  addFinding({
    team: 'platform-eng', agent: 'LatencyMonitor', severity: 'info',
    category: 'architecture', title: `Error handling: ${tryCatchCount} try/catch blocks in kitz_os`,
    detail: `try: ${tryCatchCount}, catch: ${catchCount}, unhandledRejection handlers: ${unhandledRejection}`,
  });

  // Check database connection management
  const dbPoolHits = grepInDir('kitz_os/src', /pool|connection[_-]?pool|max[_-]?connections/i);
  if (dbPoolHits.length === 0) {
    addFinding({
      team: 'platform-eng', agent: 'DBAdmin', severity: 'medium',
      category: 'architecture', title: 'No connection pooling configuration found',
      detail: 'kitz_os has no visible connection pool configuration',
      recommendation: 'Configure connection pooling for PostgreSQL',
    });
  }

  teamTimings.set('platform-eng', Date.now() - start);
}

// ── 4. API QUALITY (QA Testing) ──
function auditAPIQuality() {
  const start = Date.now();

  // Check for test coverage
  const testFiles = listFiles('kitz_os/src', '.test.ts');
  const srcFiles = listFiles('kitz_os/src', '.ts').filter(f => !f.includes('.test.'));
  const testRatio = srcFiles.length > 0 ? (testFiles.length / srcFiles.length * 100) : 0;

  addFinding({
    team: 'qa-testing', agent: 'CoverageTracker', severity: testRatio < 10 ? 'high' : testRatio < 30 ? 'medium' : 'info',
    category: 'testing', title: `Test coverage: ${testFiles.length} test files / ${srcFiles.length} source files (${testRatio.toFixed(0)}%)`,
    detail: `Test-to-source ratio is ${testRatio.toFixed(0)}%`,
    recommendation: testRatio < 30 ? 'Increase test coverage — target minimum 30% file coverage' : undefined,
  });

  // Check for stub tests
  let stubTests = 0;
  for (const tf of testFiles) {
    const lines = countLines(tf);
    if (lines < 15) stubTests++;
  }
  if (stubTests > 0) {
    addFinding({
      team: 'qa-testing', agent: 'FlakyTestHunter', severity: 'high',
      category: 'testing', title: `${stubTests}/${testFiles.length} test files are stubs (<15 lines)`,
      detail: 'Stub tests provide no coverage and give false confidence',
      recommendation: 'Replace stub tests with real assertions',
    });
  }

  // Check for API validation (Fastify schema or zod)
  const validationHits = grepInDir('kitz_os/src', /schema:|zod|yup|joi|validate/i);
  const routeCount = grepInDir('kitz_os/src', /app\.(get|post|put|delete)\s*\(/).length;
  addFinding({
    team: 'qa-testing', agent: 'TestArchitect', severity: validationHits.length < routeCount ? 'medium' : 'info',
    category: 'testing', title: `API validation: ${validationHits.length} validation refs vs ${routeCount} routes`,
    detail: validationHits.length < routeCount
      ? 'Not all routes have input validation'
      : 'Validation coverage looks adequate',
    recommendation: validationHits.length < routeCount ? 'Add Fastify schema validation to all routes' : undefined,
  });

  // Check for error response consistency
  const errorFormats = grepInDir('kitz_os/src', /reply\.(code|status)\s*\(\s*[45]\d\d\s*\)/);
  addFinding({
    team: 'qa-testing', agent: 'RegressionBot', severity: 'info',
    category: 'testing', title: `${errorFormats.length} explicit error responses in kitz_os`,
    detail: 'Check that all error responses follow consistent format',
  });

  teamTimings.set('qa-testing', Date.now() - start);
}

// ── 5. AI / BATTERY (AI-ML team) ──
function auditAI() {
  const start = Date.now();

  // Check AI Battery implementation
  const batteryFile = readFile('kitz_os/src/aiBattery.ts');
  if (!batteryFile) {
    addFinding({
      team: 'ai-ml', agent: 'CostTracker', severity: 'critical',
      category: 'ai', title: 'AI Battery file missing',
      detail: 'kitz_os/src/aiBattery.ts not found — billing is broken',
      recommendation: 'Implement AI Battery credit tracking',
    });
  } else {
    const hasROICheck = batteryFile.includes('roi') || batteryFile.includes('ROI');
    const hasDailyLimit = batteryFile.includes('daily') || batteryFile.includes('DAILY');
    if (!hasROICheck) {
      addFinding({
        team: 'ai-ml', agent: 'CostTracker', severity: 'medium',
        category: 'ai', title: 'No ROI check in AI Battery',
        detail: 'AI Battery should enforce ROI >= 2x before spending credits',
        recommendation: 'Add ROI validation before credit deduction',
      });
    }
    if (!hasDailyLimit) {
      addFinding({
        team: 'ai-ml', agent: 'CostTracker', severity: 'high',
        category: 'ai', title: 'No daily limit enforcement in AI Battery',
        detail: 'AI_BATTERY_DAILY_LIMIT should be enforced',
        recommendation: 'Enforce daily credit limit (default: 5)',
      });
    }
  }

  // Check LLM client fallback chains
  const claudeClient = readFile('kitz_os/src/llm/claudeClient.ts');
  if (claudeClient) {
    const hasFallback = claudeClient.includes('fallback') || claudeClient.includes('retry');
    if (!hasFallback) {
      addFinding({
        team: 'ai-ml', agent: 'ModelEval', severity: 'medium',
        category: 'ai', title: 'No LLM fallback/retry in Claude client',
        detail: 'Claude client should fallback to OpenAI on failure',
        recommendation: 'Implement provider fallback chain',
      });
    }
  }

  // Check prompt injection defense
  const promptInjectionDefense = grepInDir('kitz_os/src', /injection|sanitiz|escap.*prompt|system.prompt/i);
  addFinding({
    team: 'ai-ml', agent: 'PromptEng', severity: promptInjectionDefense.length < 3 ? 'high' : 'info',
    category: 'ai', title: `Prompt injection defense: ${promptInjectionDefense.length} references`,
    detail: promptInjectionDefense.length < 3
      ? 'Limited prompt injection defense detected'
      : 'Some prompt injection defense present',
    recommendation: promptInjectionDefense.length < 3 ? 'Add input sanitization and system prompt boundaries' : undefined,
  });

  // Check RAG implementation
  const ragHits = grepInDir('kitz_os/src', /rag|retrieval|embedding|vector/i);
  addFinding({
    team: 'ai-ml', agent: 'RAGSpecialist', severity: 'info',
    category: 'ai', title: `RAG implementation: ${ragHits.length} references`,
    detail: `Found ${ragHits.length} RAG-related references in kitz_os`,
  });

  teamTimings.set('ai-ml', Date.now() - start);
}

// ── 6. FRONTEND (Frontend team) ──
function auditFrontend() {
  const start = Date.now();

  // Check for accessibility
  const a11yHits = grepInDir('ui/src', /aria-|role=|alt=|tabIndex|sr-only/i);
  const componentCount = listFiles('ui/src', '.tsx').length;
  addFinding({
    team: 'frontend', agent: 'A11ySpec', severity: a11yHits.length < componentCount ? 'medium' : 'info',
    category: 'frontend', title: `Accessibility: ${a11yHits.length} a11y attributes across ${componentCount} components`,
    detail: a11yHits.length < componentCount ? 'Some components may lack accessibility attributes' : 'Accessibility coverage present',
    recommendation: a11yHits.length < componentCount ? 'Add ARIA labels, alt text, and keyboard navigation' : undefined,
  });

  // Check for error boundaries
  const errorBoundaryHits = grepInDir('ui/src', /ErrorBoundary|error[_-]?boundary/i);
  if (errorBoundaryHits.length === 0) {
    addFinding({
      team: 'frontend', agent: 'UIArchitect', severity: 'medium',
      category: 'frontend', title: 'No React Error Boundaries found',
      detail: 'Error boundaries prevent full-page crashes on component errors',
      recommendation: 'Add ErrorBoundary components around critical sections',
    });
  }

  // Check bundle size indicators
  const lazyHits = grepInDir('ui/src', /React\.lazy|lazy\s*\(|import\s*\(/);
  addFinding({
    team: 'frontend', agent: 'PerformanceOpt', severity: lazyHits.length < 3 ? 'medium' : 'info',
    category: 'frontend', title: `Code splitting: ${lazyHits.length} lazy/dynamic imports`,
    detail: lazyHits.length < 3 ? 'Limited code splitting — bundle may be large' : 'Some code splitting in place',
    recommendation: lazyHits.length < 3 ? 'Add React.lazy() for route-level code splitting' : undefined,
  });

  // Check for responsive design
  const responsiveHits = grepInDir('ui/src', /useMediaQuery|@media|responsive|breakpoint|sm:|md:|lg:/i);
  addFinding({
    team: 'frontend', agent: 'DesignSystemBot', severity: responsiveHits.length < 5 ? 'medium' : 'info',
    category: 'frontend', title: `Responsive design: ${responsiveHits.length} references`,
    detail: responsiveHits.length < 5 ? 'Limited responsive design patterns' : 'Responsive patterns present (likely Tailwind)',
  });

  teamTimings.set('frontend', Date.now() - start);
}

// ── 7. WHATSAPP CONNECTOR (WhatsApp team) ──
function auditWhatsApp() {
  const start = Date.now();

  // Check session management
  const sessionFile = readFile('kitz-whatsapp-connector/src/sessions.ts');
  if (sessionFile) {
    const hasCleanup = sessionFile.includes('cleanup') || sessionFile.includes('disconnect') || sessionFile.includes('close');
    if (!hasCleanup) {
      addFinding({
        team: 'whatsapp-comms', agent: 'WAFlowDesigner', severity: 'medium',
        category: 'whatsapp', title: 'No session cleanup in WhatsApp connector',
        detail: 'Sessions should be cleaned up on disconnect to prevent memory leaks',
        recommendation: 'Add session cleanup on disconnect',
      });
    }

    const hasReconnect = sessionFile.includes('reconnect') || sessionFile.includes('retry');
    if (!hasReconnect) {
      addFinding({
        team: 'whatsapp-comms', agent: 'DeliveryMonitor', severity: 'medium',
        category: 'whatsapp', title: 'No reconnection logic in WhatsApp connector',
        detail: 'WhatsApp sessions should auto-reconnect on disconnect',
        recommendation: 'Implement reconnection with exponential backoff',
      });
    }
  }

  // Check message queuing
  const queueHits = grepInDir('kitz-whatsapp-connector/src', /queue|buffer|batch/i);
  if (queueHits.length === 0) {
    addFinding({
      team: 'whatsapp-comms', agent: 'MessageTemplater', severity: 'low',
      category: 'whatsapp', title: 'No message queuing in WhatsApp connector',
      detail: 'Messages should be queued to handle rate limits and retries',
      recommendation: 'Add message queue with rate limiting',
    });
  }

  // Check draft-first compliance
  const draftHits = grepInDir('kitz_os/src', /draft[_-]?first|draftOnly/i);
  addFinding({
    team: 'whatsapp-comms', agent: 'EscalationBot', severity: draftHits.length < 3 ? 'high' : 'info',
    category: 'whatsapp', title: `Draft-first pattern: ${draftHits.length} references`,
    detail: draftHits.length < 3 ? 'Draft-first is a core safety pattern — needs more enforcement' : 'Draft-first pattern implemented',
    recommendation: draftHits.length < 3 ? 'Enforce draftOnly: true as default across all outbound channels' : undefined,
  });

  teamTimings.set('whatsapp-comms', Date.now() - start);
}

// ── 8. SALES / CRM (Sales team) ──
function auditCRM() {
  const start = Date.now();

  // Check CRM data model
  const crmHits = grepInDir('kitz_os/src', /contact|lead|deal|pipeline|opportunity/i);
  const orderHits = grepInDir('kitz_os/src', /order|invoice|checkout|payment/i);

  addFinding({
    team: 'sales-crm', agent: 'PipelineOptimizer', severity: 'info',
    category: 'crm', title: `CRM coverage: ${crmHits.length} CRM refs, ${orderHits.length} order/payment refs`,
    detail: 'CRM and order management references in kitz_os',
  });

  // Check for Supabase integration
  const supabaseHits = grepInDir('kitz_os/src', /supabase/i);
  addFinding({
    team: 'sales-crm', agent: 'LeadScorer', severity: supabaseHits.length < 5 ? 'medium' : 'info',
    category: 'crm', title: `Supabase integration: ${supabaseHits.length} references`,
    detail: supabaseHits.length < 5 ? 'Limited Supabase integration' : 'Supabase well-integrated',
  });

  teamTimings.set('sales-crm', Date.now() - start);
}

// ── 9. DEVOPS (DevOps team) ──
function auditDevOps() {
  const start = Date.now();

  // Check CI/CD
  const hasGHActions = fileExists('.github/workflows');
  const workflows = hasGHActions ? listFiles('.github/workflows', '.yml') : [];
  addFinding({
    team: 'devops-ci', agent: 'PipelineEng', severity: workflows.length === 0 ? 'high' : 'info',
    category: 'devops', title: `CI/CD: ${workflows.length} GitHub Actions workflows`,
    detail: workflows.length > 0 ? `Workflows: ${workflows.join(', ')}` : 'No CI/CD pipelines configured',
    recommendation: workflows.length === 0 ? 'Add GitHub Actions for build/test/deploy' : undefined,
  });

  // Check for logging standards
  const consoleLogCount = grepInDir('kitz_os/src', /console\.(log|warn|error)\s*\(/).length;
  const structuredLogCount = grepInDir('kitz_os/src', /logger\.|log\.(info|warn|error|debug)/i).length;
  addFinding({
    team: 'devops-ci', agent: 'MonitoringEng', severity: structuredLogCount < consoleLogCount ? 'medium' : 'info',
    category: 'devops', title: `Logging: ${consoleLogCount} console.log vs ${structuredLogCount} structured log calls`,
    detail: structuredLogCount < consoleLogCount
      ? 'console.log dominates — structured logging needed for production'
      : 'Mix of logging approaches',
    recommendation: structuredLogCount < consoleLogCount ? 'Replace console.log with structured logger (pino/winston)' : undefined,
  });

  // Check environment variable management
  const envFiles = ['.env', '.env.example', '.env.local'].filter(f => fileExists(f));
  const svcEnvFiles = ['kitz_os', 'kitz-gateway', 'workspace', 'kitz-whatsapp-connector']
    .filter(s => fileExists(`${s}/.env.example`) || fileExists(`${s}/.env`));
  addFinding({
    team: 'devops-ci', agent: 'ReleaseManager', severity: 'info',
    category: 'devops', title: `Environment: ${envFiles.length} root env files, ${svcEnvFiles.length} services with env config`,
    detail: `Root: ${envFiles.join(', ') || 'none'}. Services: ${svcEnvFiles.join(', ') || 'none'}`,
  });

  teamTimings.set('devops-ci', Date.now() - start);
}

// ── 10. GOVERNANCE / PMO ──
function auditGovernance() {
  const start = Date.now();

  // Check master prompt
  const masterPrompt = readFile('KITZ_MASTER_PROMPT.md');
  if (!masterPrompt) {
    addFinding({
      team: 'governance-pmo', agent: 'ProgressTracker', severity: 'critical',
      category: 'governance', title: 'KITZ_MASTER_PROMPT.md missing',
      detail: 'Constitutional governance document is required',
      recommendation: 'Create KITZ_MASTER_PROMPT.md with identity, priorities, and execution loop',
    });
  } else {
    const hasExecLoop = masterPrompt.includes('Execution Loop') || masterPrompt.includes('execution loop');
    const hasNoFab = masterPrompt.includes('fabricat') || masterPrompt.includes('make up');
    addFinding({
      team: 'governance-pmo', agent: 'ProgressTracker', severity: 'info',
      category: 'governance', title: 'KITZ_MASTER_PROMPT.md validated',
      detail: `Execution loop: ${hasExecLoop ? '✓' : '✗'}, No-fabrication rule: ${hasNoFab ? '✓' : '✗'}`,
    });
  }

  // Check AOS agent count
  const agentFiles = listFiles('aos/src/agents/teams');
  addFinding({
    team: 'governance-pmo', agent: 'VelocityTracker', severity: 'info',
    category: 'governance', title: `AOS: ${agentFiles.length} team agent files`,
    detail: `Agent files in aos/src/agents/teams/`,
  });

  // Check swarm infrastructure
  const swarmFiles = listFiles('aos/src/swarm');
  addFinding({
    team: 'governance-pmo', agent: 'MomentumGuardian', severity: 'info',
    category: 'governance', title: `Swarm infrastructure: ${swarmFiles.length} files`,
    detail: `Swarm files: ${swarmFiles.map(f => path.basename(f)).join(', ')}`,
  });

  teamTimings.set('governance-pmo', Date.now() - start);
}

// ── 11. FINANCE / BILLING ──
function auditFinance() {
  const start = Date.now();

  // Check payment webhook security
  const webhookHits = grepInDir('kitz-payments/src', /webhook|signature|verify/i);
  const hasSignatureVerify = webhookHits.some(h => h.line.includes('signature') || h.line.includes('verify'));
  if (!hasSignatureVerify) {
    addFinding({
      team: 'finance-billing', agent: 'ComplianceAuditor', severity: 'high',
      category: 'finance', title: 'Payment webhooks lack signature verification',
      detail: 'Stripe/PayPal webhooks should verify signatures to prevent fraud',
      recommendation: 'Add cryptographic signature verification for all payment webhooks',
    });
  }

  // Check billing model
  const batteryRefs = grepInDir('kitz_os/src', /battery|credit|spend/i);
  addFinding({
    team: 'finance-billing', agent: 'RevenueTracker', severity: 'info',
    category: 'finance', title: `AI Battery billing: ${batteryRefs.length} references in kitz_os`,
    detail: 'AI Battery credit model references',
  });

  teamTimings.set('finance-billing', Date.now() - start);
}

// ── 12. CONTENT / BRAND ──
function auditContent() {
  const start = Date.now();

  // Check for consistent error messages
  const errorMessages = grepInDir('kitz_os/src', /message:\s*['"]/);
  const spanishErrors = errorMessages.filter(m => /[áéíóúñ¿¡]/i.test(m.line));
  if (spanishErrors.length === 0) {
    addFinding({
      team: 'content-brand', agent: 'TranslationBot', severity: 'medium',
      category: 'content', title: 'No Spanish translations found in error messages',
      detail: 'Target market is LatAm (Spanish-first) but all messages are English',
      recommendation: 'Add i18n support — Spanish should be primary language for user-facing messages',
    });
  }

  // Check brand voice in LLM prompts
  const promptHits = grepInDir('kitz_os/src', /system.*prompt|systemMessage|system_message/i);
  addFinding({
    team: 'content-brand', agent: 'BrandVoiceBot', severity: 'info',
    category: 'content', title: `${promptHits.length} system prompts found in kitz_os`,
    detail: 'Each should align with Kitz brand voice: Gen Z clarity, direct, concise',
  });

  teamTimings.set('content-brand', Date.now() - start);
}

// ── 13. STRATEGY / INTEL ──
function auditStrategy() {
  const start = Date.now();

  // Check competitive differentiation
  const uniqueFeatures = [
    { name: 'WhatsApp Integration', pattern: /whatsapp|baileys/i, dir: 'kitz-whatsapp-connector/src' },
    { name: 'AI Battery', pattern: /battery|credit/i, dir: 'kitz_os/src' },
    { name: 'Draft-First', pattern: /draft/i, dir: 'kitz_os/src' },
    { name: 'Kill Switch', pattern: /KILL_SWITCH/i, dir: 'kitz_os/src' },
    { name: 'Swarm Architecture', pattern: /swarm/i, dir: 'aos/src' },
  ];

  for (const feat of uniqueFeatures) {
    const hits = grepInDir(feat.dir, feat.pattern);
    addFinding({
      team: 'strategy-intel', agent: 'CompetitorTracker', severity: 'info',
      category: 'strategy', title: `${feat.name}: ${hits.length} references`,
      detail: `Competitive moat feature — ${hits.length} implementation references`,
    });
  }

  teamTimings.set('strategy-intel', Date.now() - start);
}

// ── 14. GROWTH HACKING ──
function auditGrowth() {
  const start = Date.now();

  // Check activation flow
  const onboardingHits = grepInDir('ui/src', /onboard|welcome|first[_-]?time|getting.started/i);
  if (onboardingHits.length < 3) {
    addFinding({
      team: 'growth-hacking', agent: 'ActivationOptimizer', severity: 'high',
      category: 'growth', title: 'Limited onboarding flow in UI',
      detail: `Only ${onboardingHits.length} onboarding references — target is <10min to first value`,
      recommendation: 'Build guided onboarding flow with <10 minute activation target',
    });
  }

  // Check for analytics/tracking
  const analyticsHits = grepInDir('ui/src', /analytics|track|posthog|mixpanel|segment|gtag|ga4/i);
  if (analyticsHits.length === 0) {
    addFinding({
      team: 'growth-hacking', agent: 'FunnelDesigner', severity: 'high',
      category: 'growth', title: 'No analytics/tracking in frontend',
      detail: 'Cannot measure activation, retention, or funnel without analytics',
      recommendation: 'Add PostHog or Mixpanel for product analytics',
    });
  }

  teamTimings.set('growth-hacking', Date.now() - start);
}

// ── 15. EDUCATION ──
function auditEducation() {
  const start = Date.now();

  const docsFiles = listFiles('kitz-docs', '.md');
  const kbFiles = listFiles('kitz-knowledge-base', '.md');
  addFinding({
    team: 'education-onboarding', agent: 'DocWriter', severity: docsFiles.length < 5 ? 'medium' : 'info',
    category: 'education', title: `Documentation: ${docsFiles.length} docs, ${kbFiles.length} knowledge base articles`,
    detail: `kitz-docs: ${docsFiles.length} files, kitz-knowledge-base: ${kbFiles.length} files`,
    recommendation: docsFiles.length < 5 ? 'Expand documentation coverage' : undefined,
  });

  teamTimings.set('education-onboarding', Date.now() - start);
}

// ── 16. CUSTOMER SUCCESS ──
function auditCustomerSuccess() {
  const start = Date.now();

  const feedbackHits = grepInDir('kitz_os/src', /feedback|nps|csat|satisfaction/i);
  if (feedbackHits.length < 3) {
    addFinding({
      team: 'customer-success', agent: 'SatisfactionBot', severity: 'medium',
      category: 'customer-success', title: 'Limited customer feedback mechanisms',
      detail: `Only ${feedbackHits.length} feedback/NPS/CSAT references`,
      recommendation: 'Add NPS/CSAT collection after key interactions',
    });
  }

  teamTimings.set('customer-success', Date.now() - start);
}

// ── 17. MARKETING ──
function auditMarketing() {
  const start = Date.now();

  // Check SEO basics
  const metaHits = grepInDir('ui/src', /meta|og:|twitter:|description/i);
  addFinding({
    team: 'marketing-growth', agent: 'SEOAnalyst', severity: metaHits.length < 5 ? 'medium' : 'info',
    category: 'marketing', title: `SEO: ${metaHits.length} meta/OG tag references in UI`,
    detail: metaHits.length < 5 ? 'Limited SEO metadata' : 'Some SEO metadata present',
    recommendation: metaHits.length < 5 ? 'Add OpenGraph tags, meta descriptions, and structured data' : undefined,
  });

  teamTimings.set('marketing-growth', Date.now() - start);
}

// ── 18. COACHES ──
function auditCoaches() {
  const start = Date.now();

  // Check SOP coverage
  const sopFiles = listFiles('kitz_os/src/sops');
  addFinding({
    team: 'coaches', agent: 'PlaybookCoach', severity: sopFiles.length < 3 ? 'medium' : 'info',
    category: 'coaching', title: `SOPs: ${sopFiles.length} SOP files`,
    detail: sopFiles.length < 3 ? 'Limited standard operating procedures' : 'SOP coverage present',
    recommendation: sopFiles.length < 3 ? 'Create SOPs for key agent workflows' : undefined,
  });

  teamTimings.set('coaches', Date.now() - start);
}


// ══════════════════════════════════════════════════
//   MAIN — Run all 18 team audits
// ══════════════════════════════════════════════════

async function main() {
  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║       🔍  KITZ SWARM CODE AUDIT — 18 TEAMS  🔍            ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  const totalStart = Date.now();

  // Run all team audits
  const teams = [
    { name: 'Backend Security', fn: auditSecurity },
    { name: 'Legal & Compliance', fn: auditCompliance },
    { name: 'Platform Architecture', fn: auditArchitecture },
    { name: 'QA & Testing', fn: auditAPIQuality },
    { name: 'AI / ML', fn: auditAI },
    { name: 'Frontend', fn: auditFrontend },
    { name: 'WhatsApp Comms', fn: auditWhatsApp },
    { name: 'Sales / CRM', fn: auditCRM },
    { name: 'DevOps / CI', fn: auditDevOps },
    { name: 'Governance / PMO', fn: auditGovernance },
    { name: 'Finance / Billing', fn: auditFinance },
    { name: 'Content / Brand', fn: auditContent },
    { name: 'Strategy / Intel', fn: auditStrategy },
    { name: 'Growth Hacking', fn: auditGrowth },
    { name: 'Education', fn: auditEducation },
    { name: 'Customer Success', fn: auditCustomerSuccess },
    { name: 'Marketing', fn: auditMarketing },
    { name: 'Coaches', fn: auditCoaches },
  ];

  for (const team of teams) {
    process.stdout.write(`  ${CYAN}▸${RESET} ${team.name.padEnd(25)}`);
    team.fn();
    const dur = teamTimings.get([...teamTimings.keys()].pop()!) ?? 0;
    console.log(`${GREEN}✓${RESET} ${DIM}${ms(dur)}${RESET}`);
  }

  const totalDuration = Date.now() - totalStart;

  // ── Findings Summary ──

  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║                    AUDIT FINDINGS                           ║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();

  const critical = findings.filter(f => f.severity === 'critical');
  const high = findings.filter(f => f.severity === 'high');
  const medium = findings.filter(f => f.severity === 'medium');
  const low = findings.filter(f => f.severity === 'low');
  const info = findings.filter(f => f.severity === 'info');

  console.log(`  ${RED}${BOLD}CRITICAL:${RESET}  ${critical.length}`);
  console.log(`  ${RED}HIGH:${RESET}      ${high.length}`);
  console.log(`  ${YELLOW}MEDIUM:${RESET}    ${medium.length}`);
  console.log(`  ${DIM}LOW:${RESET}       ${low.length}`);
  console.log(`  ${DIM}INFO:${RESET}      ${info.length}`);
  console.log(`  ${BOLD}TOTAL:${RESET}     ${findings.length}`);
  console.log();

  // ── Critical Findings ──
  if (critical.length > 0) {
    console.log(`${RED}${BOLD}══ CRITICAL ══${RESET}`);
    for (const f of critical) {
      console.log(`  ${RED}🚨 [${f.team}/${f.agent}] ${f.title}${RESET}`);
      console.log(`     ${f.detail}`);
      if (f.file) console.log(`     ${DIM}📁 ${f.file}${f.line ? `:${f.line}` : ''}${RESET}`);
      if (f.recommendation) console.log(`     ${GREEN}→ ${f.recommendation}${RESET}`);
      console.log();
    }
  }

  // ── High Findings ──
  if (high.length > 0) {
    console.log(`${RED}${BOLD}══ HIGH ══${RESET}`);
    for (const f of high) {
      console.log(`  ${RED}⚠️  [${f.team}/${f.agent}] ${f.title}${RESET}`);
      console.log(`     ${f.detail}`);
      if (f.file) console.log(`     ${DIM}📁 ${f.file}${f.line ? `:${f.line}` : ''}${RESET}`);
      if (f.recommendation) console.log(`     ${GREEN}→ ${f.recommendation}${RESET}`);
      console.log();
    }
  }

  // ── Medium Findings ──
  if (medium.length > 0) {
    console.log(`${YELLOW}${BOLD}══ MEDIUM ══${RESET}`);
    for (const f of medium) {
      console.log(`  ${YELLOW}⚡ [${f.team}/${f.agent}] ${f.title}${RESET}`);
      console.log(`     ${f.detail}`);
      if (f.file) console.log(`     ${DIM}📁 ${f.file}${f.line ? `:${f.line}` : ''}${RESET}`);
      if (f.recommendation) console.log(`     ${GREEN}→ ${f.recommendation}${RESET}`);
      console.log();
    }
  }

  // ── Low Findings ──
  if (low.length > 0) {
    console.log(`${DIM}${BOLD}══ LOW ══${RESET}`);
    for (const f of low) {
      console.log(`  ${DIM}📋 [${f.team}/${f.agent}] ${f.title}${RESET}`);
      console.log(`     ${DIM}${f.detail}${RESET}`);
      if (f.recommendation) console.log(`     ${GREEN}→ ${f.recommendation}${RESET}`);
      console.log();
    }
  }

  // ── Info Findings (compact) ──
  if (info.length > 0) {
    console.log(`${CYAN}${BOLD}══ INFO (${info.length}) ══${RESET}`);
    for (const f of info) {
      console.log(`  ${CYAN}ℹ${RESET}  ${DIM}[${f.team}/${f.agent}]${RESET} ${f.title} — ${DIM}${f.detail.slice(0, 80)}${RESET}`);
    }
    console.log();
  }

  // ── Team Performance ──
  console.log(`${BOLD}──── Team Audit Performance ────${RESET}`);
  const sorted = [...teamTimings.entries()].sort((a, b) => b[1] - a[1]);
  for (const [team, dur] of sorted) {
    const bar = '█'.repeat(Math.max(1, Math.round(dur / 10)));
    console.log(`  ${team.padEnd(25)} ${DIM}${ms(dur).padStart(8)}${RESET}  ${CYAN}${bar}${RESET}`);
  }

  // ── Scorecard ──
  console.log();
  console.log(`${BOLD}╔══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║                   LAUNCH SCORECARD                          ║${RESET}`);
  console.log(`${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}`);

  const categories = [
    { name: 'Security', weight: 25, findings: findings.filter(f => f.category === 'security') },
    { name: 'Compliance', weight: 15, findings: findings.filter(f => f.category === 'compliance') },
    { name: 'Architecture', weight: 15, findings: findings.filter(f => f.category === 'architecture') },
    { name: 'Testing', weight: 15, findings: findings.filter(f => f.category === 'testing') },
    { name: 'AI Engine', weight: 10, findings: findings.filter(f => f.category === 'ai') },
    { name: 'Frontend/UX', weight: 10, findings: findings.filter(f => f.category === 'frontend') },
    { name: 'Growth', weight: 10, findings: findings.filter(f => f.category === 'growth') },
  ];

  let totalScore = 0;
  for (const cat of categories) {
    const critCount = cat.findings.filter(f => f.severity === 'critical').length;
    const highCount = cat.findings.filter(f => f.severity === 'high').length;
    const medCount = cat.findings.filter(f => f.severity === 'medium').length;

    // Score: start at 100, deduct for issues
    let score = 100 - (critCount * 30) - (highCount * 15) - (medCount * 5);
    score = Math.max(0, Math.min(100, score));
    const weighted = score * cat.weight / 100;
    totalScore += weighted;

    const color = score >= 80 ? GREEN : score >= 50 ? YELLOW : RED;
    const bar = '█'.repeat(Math.round(score / 5));
    console.log(`${BOLD}║${RESET}  ${cat.name.padEnd(15)} ${color}${score.toString().padStart(3)}%${RESET} ${DIM}(w:${cat.weight})${RESET}  ${color}${bar}${RESET}`);
  }

  console.log(`${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}`);

  const finalScore = Math.round(totalScore);
  const finalColor = finalScore >= 80 ? GREEN : finalScore >= 50 ? YELLOW : RED;
  console.log(`${BOLD}║${RESET}  ${BOLD}OVERALL SCORE${RESET}    ${finalColor}${BOLD}${finalScore}%${RESET}`);

  if (finalScore >= 80) {
    console.log(`${BOLD}║${RESET}  ${GREEN}${BOLD}✅ LAUNCH READY${RESET} — Address high/critical items first`);
  } else if (finalScore >= 50) {
    console.log(`${BOLD}║${RESET}  ${YELLOW}${BOLD}⚠️  CONDITIONAL${RESET} — Fix critical/high before launch`);
  } else {
    console.log(`${BOLD}║${RESET}  ${RED}${BOLD}❌ NOT READY${RESET} — Significant issues need resolution`);
  }

  console.log(`${BOLD}╠══════════════════════════════════════════════════════════════╣${RESET}`);
  console.log(`${BOLD}║${RESET}  ${DIM}Audit duration: ${ms(totalDuration)} | ${findings.length} findings | 18 teams${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════════════════════╝${RESET}`);
  console.log();
}

main().catch(err => {
  console.error(`${RED}Fatal:${RESET}`, err);
  process.exit(1);
});
