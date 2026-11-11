import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { beforeAll, describe, expect, it } from "vitest"

// Las funciones de cupo de la IA, con las migraciones reales en un Postgres en memoria
const ANA = "00000000-0000-0000-0000-00000000000a"

let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
  `)
  const dir = join(process.cwd(), "supabase", "migrations")
  for (const file of readdirSync(dir).sort()) await db.exec(readFileSync(join(dir, file), "utf8"))
  await db.exec(`insert into auth.users (id) values ('${ANA}')`)
})

const take = async (limit: number, kind = "chat", day = "2026-11-11") =>
  (await db.query<{ n: number | null }>(`select public.ai_take('${ANA}', '${day}', '${kind}', ${limit}) as n`)).rows[0]!.n

describe("cupo por usuaria", () => {
  it("reserva hasta el límite y luego devuelve null", async () => {
    expect(await take(2)).toBe(1)
    expect(await take(2)).toBe(2)
    expect(await take(2)).toBeNull()
  })

  it("devolver una consulta libera cupo", async () => {
    await db.exec(`select public.ai_release('${ANA}', '2026-11-11', 'chat')`)
    expect(await take(2)).toBe(2)
  })

  it("cada día y cada tipo van por separado", async () => {
    expect(await take(1, "advice")).toBe(1)
    expect(await take(1, "advice")).toBeNull()
    expect(await take(1, "advice", "2026-11-12")).toBe(1)
  })

  it("con límite 0 no se reserva nada", async () => {
    expect(await take(0, "chat", "2026-11-20")).toBeNull()
  })
})

describe("cupo global", () => {
  const gtake = async (max = 2, tokens = 1000) =>
    (await db.query<{ ok: boolean }>(`select public.ai_global_take('2026-11-11', ${max}, ${tokens}) as ok`)).rows[0]!.ok

  it("para al llegar al máximo de peticiones o de tokens", async () => {
    expect(await gtake()).toBe(true)
    expect(await gtake()).toBe(true)
    expect(await gtake()).toBe(false)
    await db.exec(`select public.ai_global_tokens('2026-11-11', 5000)`)
    expect(await gtake(100, 1000)).toBe(false)
  })

  it("la pausa del proveedor bloquea hasta la hora indicada", async () => {
    await db.exec(`select public.ai_global_pause('2026-11-13', now() + interval '1 hour')`)
    const ok = (await db.query<{ ok: boolean }>(`select public.ai_global_take('2026-11-13', 100, 100000) as ok`)).rows[0]!.ok
    expect(ok).toBe(false)
  })
})

describe("seguridad", () => {
  it("una usuaria con sesión no puede usar las funciones ni leer los cupos", async () => {
    await db.exec(`set request.jwt.sub = '${ANA}'; set role authenticated;`)
    try {
      await expect(db.query(`select public.ai_take('${ANA}', '2026-11-11', 'chat', 99)`)).rejects.toThrow()
      await expect(db.query(`select * from public.ai_usage`)).rejects.toThrow()
      await expect(db.query(`select * from public.ai_global_usage`)).rejects.toThrow()
    } finally {
      await db.exec(`reset role; set request.jwt.sub = '';`)
    }
  })

  it("el servidor sí puede", async () => {
    await db.exec(`set role service_role;`)
    try {
      const rows = (await db.query(`select public.ai_take('${ANA}', '2026-11-30', 'chat', 5) as n`)).rows
      expect(rows).toHaveLength(1)
    } finally {
      await db.exec(`reset role;`)
    }
  })
})
