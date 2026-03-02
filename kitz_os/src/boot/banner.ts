/**
 * KITZ OS — Terminal boot banner
 * Displays ASCII mascot + system info on startup.
 */

const P = '\x1b[38;5;135m'; // Purple (brand color)
const D = '\x1b[38;5;240m'; // Dim gray (borders)
const W = '\x1b[97m';       // Bright white (text)
const G = '\x1b[38;5;46m';  // Green (status)
const R = '\x1b[0m';        // Reset
const B = '\x1b[1m';        // Bold

interface BannerOpts {
  tools: number;
  agents: number;
  port: number | string;
  version: string;
}

export function printBanner(opts: BannerOpts): void {
  const noColor = process.env.NO_COLOR === '1' || process.env.NO_COLOR === 'true';
  const p = noColor ? '' : P;
  const d = noColor ? '' : D;
  const w = noColor ? '' : W;
  const g = noColor ? '' : G;
  const r = noColor ? '' : R;
  const b = noColor ? '' : B;

  const mascot = [
    `${p}              ██              ${r}`,
    `${p}           ████████           ${r}`,
    `${p}         ████████████         ${r}`,
    `${p}        ██████████████        ${r}`,
    `${p}        ██${r} ██  ██ ${p} ██        ${r}`,
    `${p}        ██████████████        ${r}`,
    `${p}        ███ ${r}╰────╯${p} ███        ${r}`,
    `${p}         ████████████         ${r}`,
    `${p}          ██████████          ${r}`,
    `${p}          ██      ██          ${r}`,
  ];

  const wordmark = [
    `${p}   ██╗  ██╗██╗████████╗███████╗${r}`,
    `${p}   ██║ ██╔╝██║╚══██╔══╝╚══███╔╝${r}`,
    `${p}   █████╔╝ ██║   ██║     ███╔╝ ${r}`,
    `${p}   ██╔═██╗ ██║   ██║    ███╔╝  ${r}`,
    `${p}   ██║  ██╗██║   ██║   ███████╗${r}`,
    `${p}   ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝${r}`,
  ];

  const W_BOX = 58;
  const tl = `${d}╭${'─'.repeat(W_BOX)}╮${r}`;
  const bl = `${d}╰${'─'.repeat(W_BOX)}╯${r}`;
  const empty = `${d}│${r}${' '.repeat(W_BOX)}${d}│${r}`;

  const pad = (line: string, raw: string) => {
    // raw = line stripped of ANSI for width calc
    const padding = W_BOX - raw.length;
    return `${d}│${r}${line}${' '.repeat(Math.max(0, padding))}${d}│${r}`;
  };

  // Strip ANSI for width calculation
  const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

  const lines: string[] = [
    '',
    tl,
    empty,
  ];

  // Mascot
  for (const m of mascot) {
    lines.push(pad(m, strip(m)));
  }
  lines.push(empty);

  // Wordmark
  for (const wl of wordmark) {
    lines.push(pad(wl, strip(wl)));
  }
  lines.push(empty);

  // Subtitle
  const subtitle = `   ${w}AI Business OS${r}                      ${d}v${opts.version}${r}`;
  lines.push(pad(subtitle, strip(subtitle)));
  lines.push(empty);

  // Stats
  const stats = `  ${w}${b}${opts.tools}${r}${d} tools  ·  ${r}${w}${b}${opts.agents}${r}${d} agents  ·  ${r}${w}${b}:${opts.port}${r}`;
  lines.push(pad(stats, strip(stats)));

  const status = `  ${g}●${r} ${w}All systems online${r}`;
  lines.push(pad(status, strip(status)));
  lines.push(empty);
  lines.push(bl);
  lines.push('');

  process.stdout.write(lines.join('\n') + '\n');
}
