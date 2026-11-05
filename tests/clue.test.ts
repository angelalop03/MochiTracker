import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js"
import { describe, expect, it } from "vitest"
import { parseClueExport, withoutKnownPeriods } from "../src/lib/clue/parser"
import { readExportFile } from "../src/lib/clue/read"
import { ClueImportError, summarizeImport } from "../src/lib/clue/types"

// Datos inventados con la misma forma que una exportación real
const period = (date: string, option = "medium") => ({ id: `p-${date}`, date, type: "period", value: { option } })
const list = (date: string, type: string, ...options: string[]) => ({
  id: `${type}-${date}`,
  date,
  type,
  value: options.map((option) => ({ option })),
})

const SAMPLE = JSON.stringify([period("2026-01-01")])

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

const parseCode = (data: unknown) => {
  try {
    parseClueExport(data)
    return "ok"
  } catch (e) {
    return (e as ClueImportError).code
  }
}

describe("readExportFile", () => {
  it("acepta un JSON suelto", async () => {
    expect(await readExportFile(new File([SAMPLE], "measurements.json"))).toEqual(JSON.parse(SAMPLE))
  })

  it("del ZIP solo abre measurements.json", async () => {
    const file = await zip({ "user.json": '{"email":"x"}', "measurements.json": SAMPLE })
    expect(await readExportFile(file)).toEqual(JSON.parse(SAMPLE))
  })

  it("no descifra los demás archivos aunque estén corruptos", async () => {
    const file = await zip({ "user.json": "no soy json", "measurements.json": SAMPLE }, { password: "mochi123" })
    expect(await readExportFile(file, "mochi123")).toEqual(JSON.parse(SAMPLE))
  })

  it.each([false, true])("abre un ZIP cifrado con la contraseña correcta (zipCrypto: %s)", async (zipCrypto) => {
    const file = await zip({ "measurements.json": SAMPLE }, { password: "mochi123", zipCrypto })
    expect(await readExportFile(file, "mochi123")).toEqual(JSON.parse(SAMPLE))
  })

  it.each([false, true])("avisa de contraseña incorrecta (zipCrypto: %s)", async (zipCrypto) => {
    const file = await zip({ "measurements.json": SAMPLE }, { password: "mochi123", zipCrypto })
    expect(await code(readExportFile(file, "otra"))).toBe("wrong_password")
  })

  it("pide la contraseña si falta", async () => {
    const file = await zip({ "measurements.json": SAMPLE }, { password: "mochi123" })
    expect(await code(readExportFile(file))).toBe("password_needed")
  })

  it("rechaza lo que no es de Clue", async () => {
    expect(await code(readExportFile(new File(["no soy json"], "datos.json")))).toBe("not_clue")
    expect(await code(readExportFile(new File(["no soy un zip"], "datos.zip")))).toBe("not_clue")
    expect(await code(readExportFile(await zip({ "fotos.json": SAMPLE })))).toBe("not_clue")
  })

  it("detecta archivos vacíos", async () => {
    expect(await code(readExportFile(new File([], "vacio.json")))).toBe("empty")
    expect(await code(readExportFile(new File(["[]"], "vacio.json")))).toBe("empty")
    expect(await code(readExportFile(await zip({ "measurements.json": "[]" })))).toBe("empty")
  })
})

describe("parseClueExport", () => {
  it("agrupa los días seguidos en una regla con su final", () => {
    const { periods } = parseClueExport([
      period("2026-02-03"),
      period("2026-02-01"),
      period("2026-02-02"),
      period("2026-03-01"),
    ])
    expect(periods).toEqual([
      { start_date: "2026-02-01", end_date: "2026-02-03" },
      { start_date: "2026-03-01", end_date: "2026-03-01" },
    ])
  })

  it("une una regla con hasta 2 días sin marcar en medio", () => {
    const { periods } = parseClueExport([period("2026-02-01"), period("2026-02-04")])
    expect(periods).toEqual([{ start_date: "2026-02-01", end_date: "2026-02-04" }])
  })

  it("separa si hay 3 días sin marcar", () => {
    expect(parseClueExport([period("2026-02-01"), period("2026-02-05")]).periods).toHaveLength(2)
  })

  it("el manchado no cuenta como regla", () => {
    const { periods } = parseClueExport([period("2026-02-01"), list("2026-02-20", "spotting", "red")])
    expect(periods).toHaveLength(1)
  })

  it("traduce los síntomas, uniéndolos por día y sin repetir", () => {
    const { logs } = parseClueExport([
      period("2026-02-01"),
      list("2026-02-01", "pain", "period_cramps", "headache", "migraine"),
      list("2026-02-01", "energy", "exhausted"),
      list("2026-02-02", "craving", "sweet", "salty"),
      list("2026-02-03", "digestion", "bloated", "nauseous"),
      list("2026-02-04", "skin", "acne"),
    ])
    expect(logs).toEqual([
      { date: "2026-02-01", symptoms: ["calambres", "dolor_cabeza", "cansancio"] },
      { date: "2026-02-02", symptoms: ["antojos"] },
      { date: "2026-02-03", symptoms: ["hinchazon", "nauseas"] },
      { date: "2026-02-04", symptoms: ["granitos"] },
    ])
  })

  it("una regla muy abundante se guarda como síntoma", () => {
    expect(parseClueExport([period("2026-02-01", "very_heavy")]).logs).toEqual([
      { date: "2026-02-01", symptoms: ["sangrado_abundante"] },
    ])
  })

  it("descarta todo lo que no sea regla o síntoma de la lista", () => {
    const secret = "dato-privado"
    const result = parseClueExport([
      period("2026-02-01"),
      list("2026-02-01", "sex_life", secret),
      list("2026-02-01", "medication", secret),
      list("2026-02-01", "tags", secret),
      list("2026-02-01", "feelings", secret),
      list("2026-02-01", "pain", "joint", "pain_free"),
      { id: "w", date: "2026-02-01", type: "weight", value: { kilograms: 60 } },
      { id: "s", date: "2026-02-01", type: "sleep_duration", value: { minutes: 400 } },
    ])
    expect(result.logs).toEqual([])
    expect(JSON.stringify(result)).not.toContain(secret)
    expect(JSON.stringify(result)).not.toContain("60")
  })

  it("ignora registros rotos sin fallar", () => {
    const { periods } = parseClueExport([period("2026-02-01"), period("no-es-fecha"), null, 7, { type: "period" }])
    expect(periods).toHaveLength(1)
  })

  it("acepta fechas con hora", () => {
    expect(parseClueExport([period("2026-02-01T00:00:00Z")]).periods[0]?.start_date).toBe("2026-02-01")
  })

  it("distingue lo que no es de Clue de lo que no tiene reglas", () => {
    expect(parseCode({ foo: 1 })).toBe("not_clue")
    expect(parseCode([{ foo: 1 }])).toBe("not_clue")
    expect(parseCode([])).toBe("empty")
    expect(parseCode([list("2026-02-01", "pain", "headache")])).toBe("empty")
  })
})

describe("withoutKnownPeriods", () => {
  const imported = {
    periods: [
      { start_date: "2026-01-02", end_date: "2026-01-05" },
      { start_date: "2026-02-02", end_date: "2026-02-05" },
    ],
    logs: [{ date: "2026-01-02", symptoms: ["calambres"] }],
  }

  it("no duplica una regla apuntada a mano en un día cercano", () => {
    const result = withoutKnownPeriods(imported, [{ start_date: "2026-02-03" }])
    expect(result.periods.map((p) => p.start_date)).toEqual(["2026-01-02"])
  })

  it("mantiene los síntomas y las reglas que no coinciden", () => {
    expect(withoutKnownPeriods(imported, [{ start_date: "2025-06-01" }])).toEqual(imported)
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
