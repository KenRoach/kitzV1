/**
 * Custom Tool Types — Shared types for the meta-tooling system.
 */

export interface CustomToolDef {
  name: string
  description: string
  type: 'n8n' | 'compute'
  parameters: Record<string, { type: string; description?: string; default?: unknown }>
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string
  createdBy: string
  n8nWorkflowId?: string
  templateSource?: string
  logic?: ComputeLogic
}

export interface ComputeLogic {
  steps: ComputeStep[]
}

export type ComputeStep =
  | { op: 'math'; expression: string; output: string }
  | { op: 'lookup'; table: string; key: string; output: string }
  | { op: 'format'; template: string; output: string }
  | { op: 'condition'; if: string; then: ComputeStep[]; else?: ComputeStep[] }
  | { op: 'return'; value: string }

/**
 * Safe math evaluator — NO eval(), NO new Function().
 * Supports: +, -, *, /, %, parentheses, numbers, variable names.
 */
export function evaluateMathExpression(expr: string, vars: Record<string, number>): number {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue }
    if ('+-*/%()'.includes(expr[i])) { tokens.push(expr[i]); i++; continue }
    if (/[0-9.]/.test(expr[i])) {
      let num = ''
      while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++ }
      tokens.push(num)
      continue
    }
    if (/[a-zA-Z_]/.test(expr[i])) {
      let name = ''
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { name += expr[i]; i++ }
      if (!(name in vars)) throw new Error(`Unknown variable: ${name}`)
      tokens.push(String(vars[name]))
      continue
    }
    throw new Error(`Unexpected character: ${expr[i]}`)
  }

  let pos = 0
  function peek(): string | undefined { return tokens[pos] }
  function consume(): string { return tokens[pos++] }

  function parseExpr(): number {
    let result = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = consume()
      const right = parseTerm()
      result = op === '+' ? result + right : result - right
    }
    return result
  }

  function parseTerm(): number {
    let result = parseFactor()
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume()
      const right = parseFactor()
      if (op === '*') result *= right
      else if (op === '/') { if (right === 0) throw new Error('Division by zero'); result /= right }
      else result %= right
    }
    return result
  }

  function parseFactor(): number {
    if (peek() === '(') {
      consume()
      const result = parseExpr()
      if (peek() !== ')') throw new Error('Missing closing parenthesis')
      consume()
      return result
    }
    if (peek() === '-') {
      consume()
      return -parseFactor()
    }
    const token = consume()
    if (token === undefined) throw new Error('Unexpected end of expression')
    const num = Number(token)
    if (isNaN(num)) throw new Error(`Invalid number: ${token}`)
    return num
  }

  const result = parseExpr()
  if (pos < tokens.length) throw new Error(`Unexpected token: ${tokens[pos]}`)
  return result
}

export function evaluateComputeDSL(
  logic: ComputeLogic,
  args: Record<string, unknown>,
): unknown {
  const vars: Record<string, unknown> = { ...args }

  function runSteps(steps: ComputeStep[]): unknown {
    for (const step of steps) {
      switch (step.op) {
        case 'math': {
          const numVars: Record<string, number> = {}
          for (const [k, v] of Object.entries(vars)) {
            if (typeof v === 'number') numVars[k] = v
          }
          vars[step.output] = evaluateMathExpression(step.expression, numVars)
          break
        }
        case 'lookup': {
          const table = vars[step.table]
          if (table && typeof table === 'object') {
            vars[step.output] = (table as Record<string, unknown>)[step.key]
          } else {
            vars[step.output] = undefined
          }
          break
        }
        case 'format': {
          let result = step.template
          for (const [k, v] of Object.entries(vars)) {
            result = result.replaceAll(`{{${k}}}`, String(v ?? ''))
          }
          vars[step.output] = result
          break
        }
        case 'condition': {
          const cond = evaluateCondition(step.if, vars)
          if (cond) {
            const r = runSteps(step.then)
            if (r !== undefined) return r
          } else if (step.else) {
            const r = runSteps(step.else)
            if (r !== undefined) return r
          }
          break
        }
        case 'return':
          return vars[step.value]
      }
    }
    return undefined
  }

  return runSteps(logic.steps)
}

function evaluateCondition(expr: string, vars: Record<string, unknown>): boolean {
  const comparisons = expr.match(/^(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/)
  if (comparisons) {
    const [, varName, op, rhs] = comparisons
    const lv = Number(vars[varName])
    const rv = Number(rhs)
    if (isNaN(lv) || isNaN(rv)) return false
    switch (op) {
      case '>': return lv > rv
      case '<': return lv < rv
      case '>=': return lv >= rv
      case '<=': return lv <= rv
      case '==': return lv === rv
      case '!=': return lv !== rv
    }
  }
  return !!vars[expr]
}
