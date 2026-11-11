// Conexión con el proveedor de IA. Cualquier servicio compatible con la API de chat de OpenAI
// sirve (Groq por defecto): cambiar de proveedor es cambiar variables de entorno.
// La clave solo vive en el servidor.

export interface AiMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface CompletionRequest {
  messages: AiMessage[]
  maxTokens: number
  temperature: number
  /** Si se pide, la respuesta tiene que ser un JSON con este esquema */
  json?: { name: string; schema: Record<string, unknown> }
}

export interface Completion {
  text: string
  /** Tokens gastados (entrada y salida), para el cupo global */
  tokens: number
}

export interface AiProvider {
  name: string
  complete(request: CompletionRequest): Promise<Completion>
}

/** El proveedor ha dicho que basta: hay que parar sin reintentar */
export class ProviderLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("El proveedor de IA ha llegado a su límite")
  }
}

export class ProviderError extends Error {}

export interface OpenAiCompatibleOptions {
  baseUrl: string
  apiKey: string
  model: string
  timeoutMs?: number
  fetch?: typeof fetch
}

// Los modelos que admiten un esquema JSON estricto. El resto usa el modo JSON simple
const STRICT_JSON = /gpt-oss|qwen3/i
const REASONING = /gpt-oss/i

export function openAiCompatible({ baseUrl, apiKey, model, timeoutMs = 25_000, fetch: doFetch = fetch }: OpenAiCompatibleOptions): AiProvider {
  return {
    name: model,
    async complete({ messages, maxTokens, temperature, json }) {
      const body: Record<string, unknown> = { model, messages, temperature, max_tokens: maxTokens }
      // Los modelos que razonan gastan menos tokens pensando poco: estas respuestas son cortas
      if (REASONING.test(model)) body.reasoning_effort = "low"
      if (json) {
        body.response_format = STRICT_JSON.test(model)
          ? { type: "json_schema", json_schema: { name: json.name, schema: json.schema, strict: true } }
          : { type: "json_object" }
      }

      let response: Response
      try {
        response = await doFetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        throw new ProviderError(`No se ha podido contactar con la IA: ${(error as Error).name}`)
      }

      if (response.status === 429) {
        const retry = Number(response.headers.get("retry-after"))
        throw new ProviderLimitError(Number.isFinite(retry) && retry > 0 ? retry : 60)
      }
      if (!response.ok) {
        // El cuerpo del error no incluye los datos enviados, pero tampoco se registra entero
        throw new ProviderError(`La IA respondió ${response.status}`)
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string | null } }[]
        usage?: { total_tokens?: number }
      }
      return {
        text: data.choices?.[0]?.message?.content ?? "",
        tokens: data.usage?.total_tokens ?? 0,
      }
    },
  }
}

/** Respuestas fijas, para desarrollo y pruebas: nunca sale nada del servidor */
export function mockProvider(): AiProvider {
  return {
    name: "simulado",
    async complete({ json }) {
      if (json) {
        return {
          tokens: 0,
          text: JSON.stringify({
            emociones: "Estos días puede que te apetezca ir más despacio; date permiso para decir que no a lo que no sea urgente.",
            energia: "Reparte lo más exigente al principio del día y guarda un rato para descansar por la tarde.",
            cuerpo: "Si notas la tripa hinchada, caminar un poco después de comer y beber agua suele ayudar.",
            piel: "Limpia la piel con suavidad por la mañana y por la noche y evita tocar los granitos.",
            comida: "Una cena templada con legumbres o verduras y algo de proteína te dejará más saciada.",
            movimiento: "Un paseo de veinte minutos o unos estiramientos suaves encajan muy bien hoy.",
          }),
        }
      }
      return {
        tokens: 0,
        text: "Es muy habitual en esta fase. Prueba a bajar un poco el ritmo, dormir algo más y moverte con suavidad. Si te preocupa o no mejora, coméntalo con un profesional sanitario.",
      }
    },
  }
}

export const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1"
export const DEFAULT_MODEL = "openai/gpt-oss-120b"

/** El proveedor configurado, o null si falta la clave: la IA aparece como no disponible */
export function providerFromEnv(env: Record<string, string | undefined> = process.env): AiProvider | null {
  if (env.AI_PROVIDER === "mock") return mockProvider()
  if (!env.AI_API_KEY) return null
  return openAiCompatible({
    baseUrl: env.AI_BASE_URL || DEFAULT_BASE_URL,
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL || DEFAULT_MODEL,
  })
}
