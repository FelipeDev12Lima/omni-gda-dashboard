import { NextResponse } from 'next/server';
import { Agent } from '@/components/types';

const SHEET_ID = '1_ShrO__wMswPQesTuBWpSZDf7_gGlY_gY-c9SFsUcTg';
const SHEET_GID = '0';

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(h: string): string {
  // Remove combining diacritical marks (U+0300–U+036F) without regex Unicode range
  const withoutAccents = Array.from(h.normalize('NFD'))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
  return withoutAccents.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Mapeia cabeçalho normalizado → propriedade do Agent
const HEADER_MAP: Record<string, keyof Agent> = {
  cod: 'cod',
  codigo: 'cod',
  codigoagencia: 'cod',
  agencia: 'ag',
  agente: 'ag',
  ag: 'ag',
  nome: 'ag',
  uf: 'uf',
  estado: 'uf',
  inscricao: 'insc',
  insc: 'insc',
  inscricaonoprograma: 'insc',
  calibracao: 'cal',
  calibracaoregional: 'cal',
  cal: 'cal',
  devolutiva: 'dev',
  devolutivaagente: 'dev',
  dev: 'dev',
  modelo: 'mod',
  mod: 'mod',
  segmento: 'mod',
  grupo: 'grupo',
  regional: 'reg',
  reg: 'reg',
  bp: 'bp',
};

// Fallback posicional caso os cabeçalhos não sejam reconhecidos
// (assume a ordem padrão: cod, ag, uf, insc, cal, dev, mod, grupo, reg, bp)
const POSITIONAL_KEYS: (keyof Agent)[] = [
  'cod', 'ag', 'uf', 'insc', 'cal', 'dev', 'mod', 'grupo', 'reg', 'bp',
];

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Falha ao buscar planilha: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const csv = await res.text();
    const lines = csv.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ agents: [], lastUpdated: new Date().toISOString() });
    }

    const rawHeaders = parseCSVRow(lines[0]);
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    const headerKeys = normalizedHeaders.map((h) => HEADER_MAP[h] ?? null);

    // Verifica quantos cabeçalhos foram reconhecidos
    const mappedCount = headerKeys.filter(Boolean).length;
    const useFallback = mappedCount < 3; // menos de 3 colunas mapeadas → usa posicional

    const agents: Agent[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVRow(lines[i]);
      if (cells.every((c) => !c)) continue;

      const agent: Partial<Agent> = {};

      if (useFallback) {
        POSITIONAL_KEYS.forEach((key, j) => {
          (agent as Record<string, string>)[key] = cells[j] ?? '';
        });
      } else {
        headerKeys.forEach((key, j) => {
          if (key) (agent as Record<string, string>)[key] = cells[j] ?? '';
        });
      }

      if (agent.cod || agent.ag) agents.push(agent as Agent);
    }

    return NextResponse.json({
      agents,
      lastUpdated: new Date().toISOString(),
      debug: { headers: normalizedHeaders, mappedCount, useFallback },
    });
  } catch (err) {
    console.error('[/api/agents]', err);
    return NextResponse.json({ error: 'Erro interno ao buscar dados' }, { status: 500 });
  }
}
