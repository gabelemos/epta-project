import Link from 'next/link'
import { formatPlate } from '@/lib/format'
import type { Vehicle } from '@/lib/types'

type Props = { vehicle: Vehicle; onDelete: (v: Vehicle) => void }

export function VehicleCard({ vehicle: v, onDelete }: Props) {
  const years = [v.manufactureYear, v.modelYear].filter(Boolean).join('/')
  const details = [years, v.color, v.fuel].filter(Boolean)

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{v.brand}</p>
          <h3 className="truncate text-lg font-bold text-ink">{v.model}</h3>
        </div>
        <span className="shrink-0 rounded-md border-2 border-slate-800 bg-white px-2 py-0.5 font-mono text-sm font-bold tracking-wider">
          {formatPlate(v.plate)}
        </span>
      </div>

      {details.length > 0 && <p className="mt-3 text-sm text-slate-600">{details.join(' · ')}</p>}
      {(v.city || v.ownerName) && (
        <p className="mt-1 truncate text-xs text-slate-500">
          {[v.ownerName, v.city && `${v.city}${v.state ? `/${v.state}` : ''}`].filter(Boolean).join(' — ')}
        </p>
      )}

      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
        <Link
          href={`/vehicles/${v.id}/edit`}
          className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Editar
        </Link>
        <button
          onClick={() => onDelete(v)}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          aria-label={`Excluir ${v.brand} ${v.model}`}
        >
          Excluir
        </button>
      </div>
    </article>
  )
}
