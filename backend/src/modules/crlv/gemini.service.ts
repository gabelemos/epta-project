import { env } from '../../config/env.js'
import { AppError } from '../../lib/errors.js'
import { normalizePlate } from '../vehicles/vehicles.schemas.js'

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const PROMPT = `Você é um extrator de dados de CRLV / CRLV-e (Certificado de Registro e Licenciamento de Veículo brasileiro).
Leia o documento e devolva SOMENTE um JSON com as chaves abaixo. Use null quando o dado não estiver legível ou não existir.
- plate: placa (string)
- renavam: RENAVAM (somente dígitos)
- chassis: chassi (17 caracteres)
- brand: marca (ex.: "VOLKSWAGEN")
- model: modelo (ex.: "GOL 1.0")
- manufactureYear: ano de fabricação (número)
- modelYear: ano do modelo (número)
- color: cor
- fuel: combustível
- ownerName: nome do proprietário
- city: município de emplacamento
- state: UF com 2 letras
Se o documento não for um CRLV, devolva todos os campos como null.`

export type CrlvData = {
  plate: string | null
  renavam: string | null
  chassis: string | null
  brand: string | null
  model: string | null
  manufactureYear: number | null
  modelYear: number | null
  color: string | null
  fuel: string | null
  ownerName: string | null
  city: string | null
  state: string | null
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null)
const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/\D/g, ''))
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null
}

/** Limpa/normaliza o JSON devolvido pelo modelo (que pode vir sujo ou incompleto). */
export function normalizeCrlv(raw: Record<string, unknown>): CrlvData {
  const plate = text(raw.plate)
  const renavam = text(raw.renavam)?.replace(/\D/g, '') || null
  const chassis = text(raw.chassis)?.replace(/\s/g, '').toUpperCase() ?? null
  const state = text(raw.state)?.toUpperCase().slice(0, 2) ?? null

  return {
    plate: plate ? normalizePlate(plate) : null,
    renavam,
    chassis,
    brand: text(raw.brand),
    model: text(raw.model),
    manufactureYear: num(raw.manufactureYear),
    modelYear: num(raw.modelYear),
    color: text(raw.color),
    fuel: text(raw.fuel),
    ownerName: text(raw.ownerName),
    city: text(raw.city),
    state,
  }
}

export async function extractCrlv(file: Buffer, mimeType: string): Promise<CrlvData> {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(503, 'Integração com o Gemini não configurada (GEMINI_API_KEY ausente)', 'GEMINI_NOT_CONFIGURED')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: file.toString('base64') } }] },
      ],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  }).catch(() => {
    throw new AppError(502, 'Não foi possível contatar o Gemini', 'GEMINI_UNREACHABLE')
  })

  if (response.status === 429) {
    throw new AppError(429, 'Limite da API gratuita do Gemini atingido. Tente novamente em instantes.', 'GEMINI_RATE_LIMIT')
  }
  if (!response.ok) {
    throw new AppError(502, `Falha ao processar o documento no Gemini (${response.status})`, 'GEMINI_ERROR')
  }

  const body = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const output = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''

  try {
    const cleaned = output.replace(/^```json\s*|```$/g, '').trim()
    return normalizeCrlv(JSON.parse(cleaned))
  } catch {
    throw new AppError(422, 'Não foi possível interpretar o documento enviado', 'CRLV_UNREADABLE')
  }
}
