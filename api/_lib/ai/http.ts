// Respuestas comunes de los endpoints de IA

import type { VercelResponse } from "@vercel/node"
import type { AiFailure } from "./run.js"

const STATUS: Record<AiFailure["reason"], number> = {
  unavailable: 503,
  consent: 403,
  no_data: 409,
  invalid: 422,
  failed: 502,
  user_limit: 429,
  global_limit: 429,
  paused: 429,
}

export function sendFailure(res: VercelResponse, failure: AiFailure) {
  return res.status(STATUS[failure.reason]).json(failure)
}

export function noStore(res: VercelResponse) {
  // Son datos de salud: que ningún intermediario los guarde
  res.setHeader("Cache-Control", "no-store")
}
