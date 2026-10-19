'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { VehicleCard } from '@/components/VehicleCard'
import { Alert, Button } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { formatPlate } from '@/lib/format'
import type { Vehicle, VehiclePage } from '@/lib/types'
import { useDebounce } from '@/lib/useDebounce'

const PAGE_SIZE = 9

export default function GaragePage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<VehiclePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      setData(await api<VehiclePage>(`/vehicles?${params}`))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => setPage(1), [debouncedSearch])

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api(`/vehicles/${toDelete.id}`, { method: 'DELETE' })
      setToDelete(null)
      // volta uma página se removeu o último item da página atual
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir veículo')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1
  const isSearching = debouncedSearch.length > 0

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Minha garagem</h1>
          <p className="text-sm text-slate-600">
            {data ? `${data.total} ${data.total === 1 ? 'veículo' : 'veículos'}` : 'Seus veículos em um só lugar'}
          </p>
        </div>
        <Link
          href="/vehicles/new"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Novo veículo
        </Link>
      </div>

      <div className="mt-6">
        <label htmlFor="search" className="sr-only">
          Pesquisar veículo
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por placa, marca ou modelo…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="mt-6">
        {error && (
          <div className="space-y-3">
            <Alert>{error}</Alert>
            <Button variant="secondary" onClick={load}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!error && loading && !data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando veículos">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        )}

        {!error && data && data.items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-bold text-ink">{isSearching ? 'Nenhum veículo encontrado' : 'Sua garagem está vazia'}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
              {isSearching
                ? `Nada corresponde a “${debouncedSearch}”. Tente outra busca.`
                : 'Adicione seu primeiro veículo manualmente ou importando o CRLV com IA.'}
            </p>
            {!isSearching && (
              <Link
                href="/vehicles/new"
                className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Adicionar veículo
              </Link>
            )}
          </div>
        )}

        {!error && data && data.items.length > 0 && (
          <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((v) => (
              <VehicleCard key={v.id} vehicle={v} onDelete={setToDelete} />
            ))}
          </div>
        )}

        {!error && data && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              Página {page} de {totalPages}
            </span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Próxima
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir veículo?"
        description={toDelete ? `${toDelete.brand} ${toDelete.model} (${formatPlate(toDelete.plate)}) será removido da sua garagem. Essa ação não pode ser desfeita.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
