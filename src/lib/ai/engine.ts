// Carga y usa el modelo en el navegador. Todo ocurre en el dispositivo: la app solo se conecta
// fuera para descargar el modelo, y esa descarga no lleva ningún dato de la usuaria.
// WebLLM pesa varios MB, así que se importa solo cuando alguien activa la IA.

import type { InitProgressReport, MLCEngineInterface } from "@mlc-ai/web-llm"
import { BLOCKS } from "../../content/phases"
import { MODEL_ID, buildMessages, validateReply, type AiAdvice, type AiInput } from "./advice"

// La primera generación tras cargar el modelo compila el código de la GPU y tarda más de un
// minuto. Las siguientes, unos segundos.
const FIRST_BLOCK_TIMEOUT_MS = 240_000
const BLOCK_TIMEOUT_MS = 60_000
const MIN_DEVICE_MEMORY_GB = 8

export type AiSupport = "ready" | "unsupported"

function isMobile() {
  const data = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  // Los iPad se presentan como Mac: se distinguen porque tienen pantalla táctil
  const ipad = /macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1
  return data?.mobile === true || ipad || /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * El modelo necesita unos 3,4 GB de memoria de GPU y shader-f16, así que en móviles no se
 * ofrece: una descarga de 2,3 GB para acabar fallando sería peor que no tener IA.
 */
export async function checkSupport(): Promise<AiSupport> {
  try {
    const gpu = (navigator as Navigator & { gpu?: GPU }).gpu
    if (!gpu || isMobile()) return "unsupported"
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (memory !== undefined && memory < MIN_DEVICE_MEMORY_GB) return "unsupported"
    const adapter = await gpu.requestAdapter()
    return adapter?.features.has("shader-f16") ? "ready" : "unsupported"
  } catch {
    return "unsupported"
  }
}

let engine: Promise<MLCEngineInterface> | null = null

export function loadEngine(onProgress: (report: InitProgressReport) => void) {
  engine ??= (async () => {
    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm")
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
    return CreateWebWorkerMLCEngine(worker, MODEL_ID, { initProgressCallback: onProgress })
  })().catch((error: unknown) => {
    // Se permite reintentar
    engine = null
    throw error
  })
  return engine
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("La IA ha tardado demasiado")), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** Un bloque cada vez. Los que no pasen la validación se quedan con los consejos por reglas */
export async function generateAdvice(ai: MLCEngineInterface, input: AiInput): Promise<AiAdvice | null> {
  const advice: AiAdvice = {}
  let timeout = FIRST_BLOCK_TIMEOUT_MS
  for (const { id } of BLOCKS) {
    try {
      await ai.resetChat()
      const reply = await withTimeout(
        ai.chat.completions.create({
          messages: buildMessages(input, id),
          temperature: 0.2,
          max_tokens: 70,
          extra_body: { enable_thinking: false },
        }),
        timeout
      )
      const text = validateReply(reply.choices[0]?.message.content ?? "", input.days)
      if (text) advice[id] = text
      timeout = BLOCK_TIMEOUT_MS
    } catch (error) {
      // Se para aquí y se conserva lo ya escrito: el resto se queda con las reglas
      console.error("La IA se ha detenido:", (error as Error).message)
      await ai.interruptGenerate()
      break
    }
  }
  return Object.keys(advice).length > 0 ? advice : null
}

/** Libera el espacio del modelo en el dispositivo */
export async function deleteModel() {
  const current = engine
  engine = null
  if (current) await (await current).unload().catch(() => {})
  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm")
  await deleteModelAllInfoInCache(MODEL_ID)
}
