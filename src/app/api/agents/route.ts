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
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Mapeia cabeçalho normalizado → propriedade do Agent
// Ajuste conforme os cabeçalhos reais da sua planilha
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
  calibracao: 'cal',
  cal: 'cal',
  devolutiva: 'dev',
  dev: 'dev',
  modelo: 'mod',
  mod: 'mod',
  grupo: 'grupo',
  regional: 'reg',
  reg: 'reg',
  bp: 'bp',
};

export async function GET() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

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
    const headerKeys = rawHeaders.map((h) => HEADER_MAP[normalizeHeader(h)] ?? null);

    const agents: Agent[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCSVRow(lines[i]);
      if (cells.every((c) => !c)) continue;

      const agent: Partial<Agent> = {};
      headerKeys.forEach((key, j) => {
        if (key) (agent as Record<string, string>)[key] = cells[j] ?? '';
      });

      if (agent.cod || agent.ag) agents.push(agent as Agent);
    }

    return NextResponse.json({ agents, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error('[/api/agents]', err);
    return NextResponse.json({ error: 'Erro interno ao buscar dados' }, { status: 500 });
  }
}
