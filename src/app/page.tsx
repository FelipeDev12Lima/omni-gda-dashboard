import GdaDashboard from "@/components/GdaDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Top navigation */}
      <header className="bg-white border-b border-black/[0.07] px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#003087] rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white font-extrabold text-[11px] tracking-tight">O</span>
            </div>
            <span className="font-bold text-[#003087] text-sm tracking-tight">OMNI</span>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">GDA · Gestão de Dados de Agentes</span>
      </header>

      {/* Page content */}
      <main className="p-6 max-w-[1600px] mx-auto">
        <div className="mb-5">
          <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Mapeamento de Agentes</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Acompanhe o status de inscrição, calibração e devolutiva dos agentes GDA.
          </p>
        </div>
        <GdaDashboard />
      </main>
    </div>
  );
}
