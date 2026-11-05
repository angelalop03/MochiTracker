// Abre la exportación de Clue en el propio dispositivo: el archivo nunca se sube a ningún sitio.
// zip.js se carga solo al usarlo, para que no pese a quien no importe nada.

import { ClueImportError } from "./types"

const MAX_BYTES = 50 * 1024 * 1024
/** El único archivo del ZIP que se abre. Los demás (user.json, devices.json…) no se descifran */
const MEASUREMENTS = "measurements.json"

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

async function readZip(file: Blob, password: string | undefined): Promise<unknown> {
  const { BlobReader, TextWriter, ZipReader } = await import("@zip.js/zip.js")
  const reader = new ZipReader(new BlobReader(file), { password: password || undefined, useWebWorkers: false })

  try {
    let entries
    try {
      entries = await reader.getEntries()
    } catch {
      throw new ClueImportError("not_clue")
    }

    const entry = entries.find((e) => e.filename.toLowerCase().split("/").pop() === MEASUREMENTS)
    if (!entry || entry.directory) throw new ClueImportError("not_clue")
    if (entry.encrypted && !password) throw new ClueImportError("password_needed")

    // Con el cifrado de los ZIP de Clue, una contraseña mala puede fallar o dar texto sin sentido
    const bad = new ClueImportError(entry.encrypted ? "wrong_password" : "not_clue")
    let text: string
    try {
      text = await entry.getData(new TextWriter())
    } catch {
      throw bad
    }
    try {
      return JSON.parse(text)
    } catch {
      throw bad
    }
  } finally {
    await reader.close()
  }
}

/** Devuelve el contenido de measurements.json. Lanza ClueImportError con un motivo claro si no se puede */
export async function readExportFile(file: File, password?: string): Promise<unknown> {
  if (file.size === 0) throw new ClueImportError("empty")
  if (file.size > MAX_BYTES) throw new ClueImportError("too_big")

  const data = file.name.toLowerCase().endsWith(".json")
    ? parseJson(await file.text())
    : await readZip(file, password)

  if (isEmpty(data)) throw new ClueImportError("empty")
  return data
}
