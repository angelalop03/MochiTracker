import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { beforeAll, describe, expect, it } from "vitest"

// Ejecuta las migraciones reales en un Postgres en memoria y comprueba el aislamiento
// entre usuarias. Simula lo que Supabase ya trae de serie: esquema auth, roles y auth.uid().
const ANA = "00000000-0000-0000-0000-00000000000a"
const BEA = "00000000-0000-0000-0000-00000000000b"

const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    raw_user_meta_data jsonb not null default '{}'
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public
    grant all on tables to anon, authenticated;
`

let db: PGlite

async function as<T>(role: "anon" | "authenticated", sub: string | null, fn: () => Promise<T>) {
  await db.exec(`set request.jwt.sub = '${sub ?? ""}'; set role ${role};`)
  try {
    return await fn()
  } finally {
    await db.exec(`reset role; set request.jwt.sub = '';`)
  }
}

const count = async (sql: string) => (await db.query(sql)).rows.length

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STUB)
  const dir = join(process.cwd(), "supabase", "migrations")
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"))
  }
  await db.exec(`
    insert into auth.users (id, raw_user_meta_data) values
      ('${ANA}', '{"name":"Ana","health_consent":true,"privacy_version":"2026-11"}'),
      ('${BEA}', '{"name":"Bea"}');
    insert into public.periods (user_id, start_date) values
      ('${ANA}', '2026-10-01'), ('${BEA}', '2026-10-05');
    insert into public.daily_logs (user_id, date, energy) values
      ('${ANA}', '2026-10-02', 3), ('${BEA}', '2026-10-06', 2);
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
      ('${ANA}', 'https://push/ana', 'k', 'a'), ('${BEA}', 'https://push/bea', 'k', 'a');
    insert into public.notification_log (user_id, date, kind, channel, phase) values
      ('${ANA}', '2026-10-02', 'daily', 'email', 'menstrual');
  `)
})

describe("trigger de registro", () => {
  it("crea el perfil y guarda el consentimiento con fecha del servidor", async () => {
    const { rows } = await db.query<{ name: string; health_consent_at: Date | null; privacy_version: string }>(
      `select name, health_consent_at, privacy_version from public.profiles where id = '${ANA}'`
    )
    expect(rows[0]?.name).toBe("Ana")
    expect(rows[0]?.health_consent_at).not.toBeNull()
    expect(rows[0]?.privacy_version).toBe("2026-11")
  })

  it("no marca consentimiento si no se dio", async () => {
    const { rows } = await db.query<{ health_consent_at: Date | null }>(
      `select health_consent_at from public.profiles where id = '${BEA}'`
    )
    expect(rows[0]?.health_consent_at).toBeNull()
  })
})

describe.each(["profiles", "periods", "daily_logs", "push_subscriptions"])("RLS en %s", (table) => {
  it("una usuaria solo ve sus filas", async () => {
    const rows = await as("authenticated", ANA, () => count(`select 1 from public.${table}`))
    expect(rows).toBe(1)
  })

  it("sin sesión no se puede leer nada", async () => {
    await expect(as("anon", null, () => count(`select 1 from public.${table}`))).rejects.toThrow(/permission denied/)
  })
})

describe("escrituras cruzadas", () => {
  it("no se puede crear una fila a nombre de otra usuaria", async () => {
    await expect(
      as("authenticated", ANA, () =>
        db.exec(`insert into public.periods (user_id, start_date) values ('${BEA}', '2026-11-01')`)
      )
    ).rejects.toThrow(/row-level security/)
  })

  it("no se puede modificar ni borrar lo de otra usuaria", async () => {
    await as("authenticated", ANA, async () => {
      await db.exec(`update public.daily_logs set energy = 5 where user_id = '${BEA}'`)
      await db.exec(`delete from public.periods where user_id = '${BEA}'`)
      await db.exec(`update public.profiles set name = 'hackeada' where id = '${BEA}'`)
    })
    const { rows } = await db.query<{ energy: number }>(
      `select energy from public.daily_logs where user_id = '${BEA}'`
    )
    expect(rows[0]?.energy).toBe(2)
    expect(await count(`select 1 from public.periods where user_id = '${BEA}'`)).toBe(1)
    expect(await count(`select 1 from public.profiles where name = 'hackeada'`)).toBe(0)
  })

  it("no se puede traspasar una fila propia a otra usuaria", async () => {
    await expect(
      as("authenticated", ANA, () => db.exec(`update public.periods set user_id = '${BEA}'`))
    ).rejects.toThrow(/row-level security/)
  })
})

describe("notification_log", () => {
  it("el navegador no puede leerla ni escribirla", async () => {
    await expect(
      as("authenticated", ANA, () => count(`select 1 from public.notification_log`))
    ).rejects.toThrow(/permission denied/)
  })

  it("no permite repetir el mismo aviso el mismo día", async () => {
    await expect(
      db.exec(`insert into public.notification_log (user_id, date, kind, channel, phase)
               values ('${ANA}', '2026-10-02', 'daily', 'email', 'menstrual')`)
    ).rejects.toThrow(/unique/)
  })
})

describe("restricciones", () => {
  it("rechaza energía fuera de 1-5 y regla que acaba antes de empezar", async () => {
    await expect(
      db.exec(`insert into public.daily_logs (user_id, date, energy) values ('${ANA}', '2026-10-09', 9)`)
    ).rejects.toThrow(/check/)
    await expect(
      db.exec(`insert into public.periods (user_id, start_date, end_date)
               values ('${ANA}', '2026-10-20', '2026-10-10')`)
    ).rejects.toThrow(/check/)
  })

  it("no duplica una regla reimportada", async () => {
    await expect(
      db.exec(`insert into public.periods (user_id, start_date) values ('${ANA}', '2026-10-01')`)
    ).rejects.toThrow(/unique/)
  })
})

describe("borrar la cuenta", () => {
  it("elimina todas sus filas y no toca las de otras", async () => {
    await db.exec(`delete from auth.users where id = '${ANA}'`)
    for (const [table, col] of [
      ["profiles", "id"],
      ["periods", "user_id"],
      ["daily_logs", "user_id"],
      ["push_subscriptions", "user_id"],
      ["notification_log", "user_id"],
    ]) {
      expect(await count(`select 1 from public.${table} where ${col} = '${ANA}'`)).toBe(0)
    }
    expect(await count(`select 1 from public.profiles where id = '${BEA}'`)).toBe(1)
  })
})
