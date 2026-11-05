import type { ExportEntry } from "./read"
import { ClueImportError, type ImportResult } from "./types"

// PENDIENTE: el formato del JSON de Clue no está documentado. Este parser se escribe con
// un ejemplo real. Hasta entonces la app abre el archivo, avisa y no guarda nada.
export const CLUE_PARSER_READY = false

export function parseClueExport(entries: ExportEntry[]): ImportResult {
  void entries
  throw new ClueImportError("not_clue")
}
