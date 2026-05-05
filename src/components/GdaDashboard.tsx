"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Agent, FilterState } from "./types";
import { AGENTS } from "@/data/agents";

const POLL_INTERVAL = 60_000; // atualiza a cada 60 segundos

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

// ─── Icons ───────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconXSmall = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconChevron = ({ up }: { up: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-300 ${up ? "rotate-0" : "rotate-180"}`}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconNoResults = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="8" x2="14" y2="14"/><line x1="14" y1="8" x2="8" y2="14"/>
  </svg>
);

// ─── Model segment cards ──────────────────────────────────────
const MODEL_THEME = {
  "MASTER": {
    badge: "bg-blue-50 text-[#003087] ring-1 ring-blue-200",
    calibBar: "bg-[#003087]",
    topBar: "bg-[#003087]",
    border: "border-[#003087]",
    activeBg: "bg-blue-50/40",
    shadow: "shadow-blue-200/60",
    headerIndicator: "bg-blue-200/20 text-blue-200 border-blue-300/20",
  },
  "CANAL DIRETO": {
    badge: "bg-orange-50 text-[#FF6B00] ring-1 ring-orange-200",
    calibBar: "bg-[#FF6B00]",
    topBar: "bg-[#FF6B00]",
    border: "border-[#FF6B00]",
    activeBg: "bg-orange-50/40",
    shadow: "shadow-orange-200/60",
    headerIndicator: "bg-orange-200/20 text-orange-200 border-orange-300/20",
  },
  "MICROCREDITO": {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    calibBar: "bg-emerald-500",
    topBar: "bg-emerald-500",
    border: "border-emerald-500",
    activeBg: "bg-emerald-50/40",
    shadow: "shadow-emerald-200/60",
    headerIndicator: "bg-emerald-200/20 text-emerald-200 border-emerald-300/20",
  },
} as const;

function MiniBar({ value, barClass }: { value: number; barClass: string }) {
  return (
    <div className="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function ModelCard({
  model, agents, selected, dimmed, onClick,
}: {
  model: string; agents: Agent[]; selected: boolean; dimmed: boolean; onClick: () => void;
}) {
  const t = MODEL_THEME[model as keyof typeof MODEL_THEME];
  const total = agents.length;
  const inscritos = agents.filter(d => d.insc === "Inscrito").length;
  const calibrados = agents.filter(d => d.cal === "Realizado").length;
  const pendentes = agents.filter(d => d.dev === "Pendente").length;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer flex-1 min-w-0 rounded-xl border-2 overflow-hidden transition-all duration-200 select-none
        ${selected
          ? `${t.border} ${t.activeBg} shadow-lg ${t.shadow}`
          : dimmed
            ? "border-transparent bg-white/50 opacity-50 hover:opacity-75"
            : "border-transparent bg-white shadow-sm hover:shadow-md hover:border-black/10"
        }
      `}
    >
      <div className={`h-1 ${t.topBar}`} />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-5">
          <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-lg ${t.badge}`}>{model}</span>
          <div className="text-right">
            <p className="text-[32px] font-bold text-gray-900 leading-none tabular-nums">{total}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">agentes</p>
          </div>
        </div>

        {/* Progress rows */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[10px] text-gray-500">Inscritos</span>
              <span className="text-[11px] font-semibold text-gray-700">
                {inscritos}
                <span className="text-[10px] font-normal text-gray-400 ml-1">({pct(inscritos, total)}%)</span>
              </span>
            </div>
            <MiniBar value={pct(inscritos, total)} barClass="bg-emerald-400" />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[10px] text-gray-500">Calibração</span>
              <span className="text-[11px] font-semibold text-gray-700">
                {calibrados}
                <span className="text-[10px] font-normal text-gray-400 ml-1">({pct(calibrados, inscritos)}% inscritos)</span>
              </span>
            </div>
            <MiniBar value={pct(calibrados, inscritos)} barClass={t.calibBar} />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[10px] text-gray-500">Dev. pendente</span>
              <span className={`text-[11px] font-semibold ${pendentes > 0 ? "text-amber-600" : "text-gray-400"}`}>
                {pendentes > 0 ? pendentes : "—"}
              </span>
            </div>
            <MiniBar value={pct(pendentes, total)} barClass="bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    Realizado: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    Pendente: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    Inscrito: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    "Não Inscrito": "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    "Não se aplica": "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200",
  };
  const dotMap: Record<string, string> = {
    Realizado: "bg-emerald-500", Pendente: "bg-amber-500", Inscrito: "bg-emerald-500",
    "Não Inscrito": "bg-red-500", "Não se aplica": "bg-gray-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${map[value] ?? "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotMap[value] ?? "bg-gray-300"}`} />
      {value}
    </span>
  );
}

function ModeloBadge({ value }: { value: string }) {
  if (value === "MASTER")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#003087] ring-1 ring-inset ring-blue-200">MASTER</span>;
  if (value === "CANAL DIRETO")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-[#FF6B00] ring-1 ring-inset ring-orange-200">CANAL DIRETO</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">MICROCREDITO</span>;
}

// ─── Dashboard ────────────────────────────────────────────────
const MODELS = ["MASTER", "CANAL DIRETO", "MICROCREDITO"];

export default function GdaDashboard({ initialData = AGENTS }: { initialData?: Agent[] }) {
  const [liveData, setLiveData] = useState<Agent[] | null>(null);
  const [syncStatus, setSyncStatus] = useState<"initial" | "ok" | "error">("initial");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("HTTP error");
      const json = await res.json();
      if (Array.isArray(json.agents) && json.agents.length > 0) {
        setLiveData(json.agents);
        setLastUpdated(new Date(json.lastUpdated));
        setSyncStatus("ok");
      } else if (json.error) {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const data = liveData ?? initialData;

  const [filters, setFilters] = useState<FilterState>({
    busca: "", uf: "", modelo: "", inscricao: "", calibracao: "", devolutiva: "",
  });

  const ufs = useMemo(() => Array.from(new Set(data.map((d) => d.uf))).sort(), [data]);

  // Filtered by everything except model — used by segment cards
  const baseFiltered = useMemo(() => {
    const q = filters.busca.toLowerCase();
    return data.filter((d) => {
      if (q && !["ag", "grupo", "reg", "bp"].some((k) => d[k as keyof Agent].toLowerCase().includes(q))) return false;
      if (filters.uf && d.uf !== filters.uf) return false;
      if (filters.inscricao && d.insc !== filters.inscricao) return false;
      if (filters.calibracao && d.cal !== filters.calibracao) return false;
      if (filters.devolutiva && d.dev !== filters.devolutiva) return false;
      return true;
    });
  }, [filters, data]);

  // Fully filtered (used by table)
  const filtered = useMemo(() => {
    if (!filters.modelo) return baseFiltered;
    return baseFiltered.filter((d) => d.mod === filters.modelo);
  }, [baseFiltered, filters.modelo]);

  const modelGroups = useMemo(() =>
    MODELS.map((model) => ({ model, agents: baseFiltered.filter((d) => d.mod === model) })),
    [baseFiltered]
  );

  const set = (key: keyof FilterState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleModel = (model: string) =>
    setFilters((prev) => ({ ...prev, modelo: prev.modelo === model ? "" : model }));

  const clearFilters = () =>
    setFilters({ busca: "", uf: "", modelo: "", inscricao: "", calibracao: "", devolutiva: "" });

  const [showTable, setShowTable] = useState(true);

  const hasFilters = Object.values(filters).some(Boolean);
  const showModelCol = !filters.modelo;

  const selectCls = "text-xs px-2.5 py-1.5 rounded-lg border border-black/[0.12] bg-white h-8 focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]/40 transition-all cursor-pointer text-gray-700";

  const activeTheme = filters.modelo ? MODEL_THEME[filters.modelo as keyof typeof MODEL_THEME] : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.08] shadow-lg shadow-black/[0.05]">
      {/* HEADER */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #003087 0%, #00419e 60%, #0050c0 100%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 rounded-xl flex-shrink-0 flex items-center justify-center px-3"
            style={{
              background: "linear-gradient(135deg, #FF4500 0%, #FFAA00 100%)",
              boxShadow: "0 4px 14px rgba(255,107,0,0.45)",
            }}
          >
            <img src="/logo-gda.png" alt="Gente do Agente" className="h-7 w-auto object-contain" />
          </div>
          <div>
            <p className="text-white font-semibold text-[13px] leading-tight">Dashboard Gente do Agente</p>
            <p className="text-white/50 text-[11px] mt-0.5">Mapeamento de Agentes · OMNI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          <div className="flex items-center gap-1.5">
            {syncStatus === "ok" && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-white/50">
                  {lastUpdated ? formatTimeAgo(lastUpdated) : "sincronizado"}
                </span>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[10px] text-white/50">erro ao sincronizar</span>
              </>
            )}
            {syncStatus === "initial" && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                <span className="text-[10px] text-white/50">carregando...</span>
              </>
            )}
          </div>
          {activeTheme && (
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${activeTheme.headerIndicator}`}>
              {filters.modelo}
            </span>
          )}
          <div className="bg-white/[0.12] text-white/90 text-xs px-3.5 py-1.5 rounded-full font-medium border border-white/[0.15]">
            {filtered.length} agente{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* MODEL SEGMENT CARDS */}
      <div className="p-4 bg-[#F5F6FA] border-b border-black/[0.06] flex gap-3">
        {modelGroups.map(({ model, agents }) => (
          <ModelCard
            key={model}
            model={model}
            agents={agents}
            selected={filters.modelo === model}
            dimmed={!!filters.modelo && filters.modelo !== model}
            onClick={() => toggleModel(model)}
          />
        ))}
      </div>

      {/* TABLE TOGGLE */}
      <button
        onClick={() => setShowTable((v) => !v)}
        className="w-full bg-white border-b border-black/[0.06] px-5 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors group"
      >
        <span className="text-[11px] text-gray-400 font-medium group-hover:text-gray-600 transition-colors">
          {showTable ? "Ocultar planilha" : "Ver planilha de agentes"}
        </span>
        <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
          <IconChevron up={showTable} />
        </span>
      </button>

      {/* FILTERS + TABLE */}
      {showTable && (
      <>
      <div className="bg-white px-5 py-3 flex flex-wrap gap-2 items-center border-b border-black/[0.06]">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input
            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-black/[0.12] bg-white h-8 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087]/40 transition-all text-gray-700 placeholder-gray-400"
            placeholder="Buscar agente, grupo, regional, BP..."
            value={filters.busca}
            onChange={set("busca")}
          />
        </div>
        <select className={selectCls} value={filters.uf} onChange={set("uf")}>
          <option value="">Todos os UFs</option>
          {ufs.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className={selectCls} value={filters.inscricao} onChange={set("inscricao")}>
          <option value="">Inscrição</option>
          <option>Inscrito</option>
          <option>Não Inscrito</option>
        </select>
        <select className={selectCls} value={filters.calibracao} onChange={set("calibracao")}>
          <option value="">Calibração</option>
          <option>Realizado</option>
          <option>Não se aplica</option>
        </select>
        <select className={selectCls} value={filters.devolutiva} onChange={set("devolutiva")}>
          <option value="">Devolutiva</option>
          <option>Realizado</option>
          <option>Pendente</option>
          <option>Não se aplica</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#FF6B00]/30 text-[#FF6B00] bg-orange-50 hover:bg-orange-100 h-8 transition-colors font-medium"
          >
            <IconXSmall />
            Limpar filtros
          </button>
        )}
        {hasFilters && (
          <span className="ml-auto text-[11px] text-gray-400 font-medium">
            {filtered.length} de {data.length} resultados
          </span>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "linear-gradient(180deg, #003087 0%, #002a78 100%)" }}>
              {[
                "Cód.", "Agente", "UF",
                ...(showModelCol ? ["Modelo"] : []),
                "Inscrição", "Calibração", "Devolutiva", "Regional", "Grupo", "BP",
              ].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-white/70 font-semibold border-r border-white/[0.08] last:border-r-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={showModelCol ? 10 : 9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2.5 text-gray-300">
                    <IconNoResults />
                    <p className="text-sm text-gray-400">Nenhum agente encontrado com os filtros selecionados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((d, i) => (
                <tr
                  key={`${d.cod}-${i}`}
                  className={`border-b border-black/[0.04] hover:bg-blue-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                >
                  <td className="px-3 py-2 text-gray-400 text-[11px]">{d.cod}</td>
                  <td className="px-3 py-2 font-semibold text-gray-800">{d.ag}</td>
                  <td className="px-3 py-2">
                    <span className="bg-[#E8EEF8] text-[#003087] text-[10px] font-bold px-1.5 py-0.5 rounded">{d.uf}</span>
                  </td>
                  {showModelCol && (
                    <td className="px-3 py-2"><ModeloBadge value={d.mod} /></td>
                  )}
                  <td className="px-3 py-2"><StatusPill value={d.insc} /></td>
                  <td className="px-3 py-2"><StatusPill value={d.cal} /></td>
                  <td className="px-3 py-2"><StatusPill value={d.dev} /></td>
                  <td className="px-3 py-2 text-gray-500 max-w-[130px] truncate" title={d.reg}>{d.reg}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[170px] truncate" title={d.grupo}>{d.grupo}</td>
                  <td className="px-3 py-2 text-gray-500 text-[11px]">{d.bp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
