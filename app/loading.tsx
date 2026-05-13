export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950/85 backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(29,78,216,0.24),_transparent_50%)]" />

      <div className="relative flex w-[92%] max-w-md flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-8 py-8 text-center shadow-2xl">
        <div className="relative mb-5 h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-300 border-r-blue-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border border-white/15 animate-pulse" />
        </div>

        <p className="text-base font-semibold tracking-wide text-white">Chargement de la page</p>
        <p className="mt-2 text-sm text-blue-100/90">Préparation de votre espace en cours...</p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-[loading-slide_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400" />
        </div>
      </div>
    </div>
  )
}
