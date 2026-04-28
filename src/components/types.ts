export interface Agent {
  cod: string;
  ag: string;
  uf: string;
  insc: string;
  cal: string;
  dev: string;
  mod: string;
  grupo: string;
  reg: string;
  bp: string;
}

export interface FilterState {
  busca: string;
  uf: string;
  modelo: string;
  inscricao: string;
  calibracao: string;
  devolutiva: string;
}

export interface KPIs {
  total: number;
  inscritos: number;
  calibrados: number;
  pendentes: number;
}
