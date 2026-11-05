import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js"
import { describe, expect, it } from "vitest"
import { readExportFile } from "../src/lib/clue/read"
import { ClueImportError, summarizeImport } from "../src/lib/clue/types"

const SAMPLE = JSON.stringify([{ date: "2026-01-01" }])

async function zip(files: Record<string, string>, options: { password?: string; zipCrypto?: boolean } = {}) {
  const writer = new ZipWriter(new BlobWriter("application/zip"), { ...options, useWebWorkers: false })
  for (const [name, content] of Object.entries(files)) await writer.add(name, new TextReader(content))
  return new File([await writer.close()], "ClueDataDownload.zip")
}

const code = (promise: Promise<unknown>) =>
  promise.then(
    () => "ok",
    (e: ClueImportError) => e.code
  )

describe("readExportFile", () => {
  it("acepta un JSON suelto", async () => {
    const [entry] = await readExportFile(new File([SAMPLE], "measurements.json"))
    expect(entry?.data).toEqual([{ date: "2026-01-01" }])
  })

  it("abre un ZIP sin contraseña", async () => {
    const entries = await readExportFile(await zip({ "data.json": SAMPLE, "leeme.txt": "hola" }))
    expect(entries.map((e) => e.name)).toEqual(["data.json"])
  })

  it.each([false, true])("abre un ZIP cifrado con la contraseña correcta (zipCrypto: %s)", async (zipCrypto) => {
    const file = await zip({ "data.json": SAMPLE }, { password: "mochi123", zipCrypto })
    const [entry] = await readExportFile(file, "mochi123")
    expect(entry?.data).toEqual([{ date: "2026-01-01" }])
  })

  it.each([false, true])("avisa de contraseña incorrecta (zipCrypto: %s)", async (zipCrypto) => {
    const file = await zip({ "data.json": SAMPLE }, { password: "mochi123", zipCrypto })
    expect(await code(readExportFile(file, "otra"))).toBe("wrong_password")
  })

  it("pide la contraseña si falta", async () => {
    const file = await zip({ "data.json": SAMPLE }, { password: "mochi123" })
    expect(await code(readExportFile(file))).toBe("password_needed")
  })

  it("rechaza lo que no es de Clue", async () => {
    expect(await code(readExportFile(new File(["no soy json"], "datos.json")))).toBe("not_clue")
    expect(await code(readExportFile(new File(["no soy un zip"], "datos.zip")))).toBe("not_clue")
    expect(await code(readExportFile(await zip({ "foto.txt": "hola" })))).toBe("not_clue")
  })

  it("detecta archivos vacíos", async () => {
    expect(await code(readExportFile(new File([], "vacio.json")))).toBe("empty")
    expect(await code(readExportFile(new File(["[]"], "vacio.json")))).toBe("empty")
    expect(await code(readExportFile(await zip({ "data.json": "{}" })))).toBe("empty")
  })
})

describe("summarizeImport", () => {
  it("resume ciclos, fecha de inicio y síntomas", () => {
    const summary = summarizeImport({
      periods: [
        { start_date: "2024-04-02", end_date: null },
        { start_date: "2024-03-05", end_date: "2024-03-09" },
      ],
      logs: [
        { date: "2024-03-06", symptoms: ["calambres"] },
        { date: "2024-03-07", symptoms: [] },
      ],
    })
    expect(summary.text).toBe("Hemos encontrado 2 ciclos desde marzo de 2024 y 1 día con síntomas.")
  })

  it("sin reglas avisa de que está vacío", () => {
    expect(() => summarizeImport({ periods: [], logs: [] })).toThrow(ClueImportError)
  })
})
