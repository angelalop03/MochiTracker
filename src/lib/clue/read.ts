// Abre la exportación de Clue en el propio dispositivo: el archivo nunca se sube a ningún sitio.
// zip.js se carga solo al usarlo, para que no pese a quien no importe nada.

import { ClueImportError } from "./types"

const MAX_BYTES = 50 * 1024 * 1024

export interface ExportEntry {
  name: string
  data: unknown
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    throw new ClueImportError("not_clue")
  }
}

function isEmpty(data: unknown) {
  if (data === null) return true
  if (Array.isArray(data)) return data.length === 0
  return typeof data === "object" && Object.keys(data).length === 0
}

async function readZip(file: Blob, password: string | undefined): Promise<ExportEntry[]> {
  const { BlobReader, TextWriter, ZipReader } = await import("@zip.js/zip.js")
  const reader = new ZipReader(new BlobReader(file), { password: password || undefined, useWebWorkers: false })

  try {
    let entries
    try {
      entries = await reader.getEntries()
    } catch {
      throw new ClueImportError("not_clue")
    }

    const files = entries.filter((e) => !e.directory && e.filename.toLowerCase().endsWith(".json"))
    if (files.length === 0) throw new ClueImportError("not_clue")

    const result: ExportEntry[] = []
    for (const entry of files) {
      if (entry.directory) continue
      if (entry.encrypted && !password) throw new ClueImportError("password_needed")
      let text: string
      try {
        text = await entry.getData(new TextWriter())
      } catch {
        throw new ClueImportError(entry.encrypted ? "wrong_password" : "not_clue")
      }
      try {
        result.push({ name: entry.filename, data: JSON.parse(text) })
      } catch {
        // Con el cifrado antiguo de ZIP, una contraseña mala puede dar texto sin sentido
        throw new ClueImportError(entry.encrypted ? "wrong_password" : "not_clue")
      }
    }
    return result
  } finally {
    await reader.close()
  }
}

/** Devuelve los JSON del archivo. Lanza ClueImportError con un motivo claro si no se puede */
export async function readExportFile(file: File, password?: string): Promise<ExportEntry[]> {
  if (file.size === 0) throw new ClueImportError("empty")
  if (file.size > MAX_BYTES) throw new ClueImportError("too_big")

  const entries = file.name.toLowerCase().endsWith(".json")
    ? [{ name: file.name, data: parseJson(await file.text()) }]
    : await readZip(file, password)

  if (entries.every((e) => isEmpty(e.data))) throw new ClueImportError("empty")
  return entries
}
