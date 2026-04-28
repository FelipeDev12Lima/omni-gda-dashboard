# Dashboard GDA — OMNI

Dashboard de mapeamento de agentes GDA com identidade visual OMNI.

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar em modo desenvolvimento
npm run dev

# 3. Abrir no navegador
http://localhost:3000
```

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx       # Layout raiz (metadados, fontes)
│   ├── page.tsx         # Página principal
│   └── globals.css      # Estilos globais + variáveis OMNI
├── components/
│   ├── GdaDashboard.tsx # Componente principal do dashboard
│   └── types.ts         # Tipos TypeScript
└── data/
    └── agents.ts        # Dados dos agentes (substituir pela API futuramente)
```

## Conectar com Excel / SharePoint (próximo passo)

Para substituir os dados estáticos por dados dinâmicos do Excel:

### Opção 1 — Excel local (upload manual)
Instalar `xlsx` e criar uma API route:
```bash
npm install xlsx
```

### Opção 2 — SharePoint / Microsoft Graph API
```bash
npm install @azure/msal-node
```
Criar em `src/app/api/agents/route.ts` a chamada ao Microsoft Graph.

O componente `GdaDashboard` já aceita `initialData` como prop,
então basta passar os dados carregados da API:

```tsx
// page.tsx
const data = await fetchFromSharePoint(); // sua função de fetch
return <GdaDashboard initialData={data} />;
```

## Fonte customizada

A fonte oficial Balloon pode ser instalada no CSS depois:
```css
@font-face {
  font-family: 'Balloon';
  src: url('/fonts/Balloon.woff2') format('woff2');
}
```
Coloque o arquivo em `public/fonts/` e ajuste o `tailwind.config.ts`.
