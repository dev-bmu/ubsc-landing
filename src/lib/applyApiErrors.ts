import type { ApiErrorBody } from '@/types/contracts/contracts'

/**
 * Ekstrak envelope error UBSC dari sebuah error axios.
 *
 * Envelope kegagalan API: { success: false, error: { code, message, fields?, requestId? } }
 * (ubsc-api errorMiddleware). `fields` memetakan nama field -> array pesan, itulah yang dipakai
 * untuk menaruh error di bawah tiap input (padanan `errors` Inertia).
 *
 * Menggantikan `services/Auth.ts:toApiError` lama yang membaca `error` sebagai STRING dan diam-diam
 * membuang `fields` (R-tech-debt Fase 1). Dipakai AuthModal, ProfileModal, dan form lain.
 */
export interface ExtractedApiError {
  message: string
  code?: string
  /** Pesan pertama per field, siap dipasang ke setError / InputError. */
  fieldErrors: Record<string, string>
}

interface AxiosLikeError {
  response?: { data?: { error?: ApiErrorBody } }
}

export function extractApiError(error: unknown, fallbackMessage = 'Terjadi kesalahan. Coba lagi.'): ExtractedApiError {
  const body = (error as AxiosLikeError | undefined)?.response?.data?.error

  if (!body) {
    return { message: fallbackMessage, fieldErrors: {} }
  }

  const fieldErrors: Record<string, string> = {}
  if (body.fields) {
    for (const [name, messages] of Object.entries(body.fields)) {
      if (Array.isArray(messages) && messages.length > 0) fieldErrors[name] = messages[0]
    }
  }

  return { message: body.message || fallbackMessage, code: body.code, fieldErrors }
}
