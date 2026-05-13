export default function ReservationsLoading() {
  return (
    <div className="min-h-[60vh] px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-4 w-40 animate-pulse rounded bg-blue-100" />
            <div className="mt-3 h-3 w-56 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-xl bg-blue-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-100 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-blue-50" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-blue-800">
          <span className="h-2.5 w-2.5 animate-ping rounded-full bg-blue-500" />
          <span className="text-sm font-medium">Chargement de vos reservations...</span>
        </div>
      </div>
    </div>
  )
}
