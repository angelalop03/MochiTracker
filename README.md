# Isla Mochi

Web app de acompañamiento del ciclo menstrual. Cada fase es una estación en una pequeña isla 3D, y Mochi, un personaje hecho solo con código, refleja la energía de esa fase. Muestra en qué fase estás hoy, qué día de ciclo es y consejos en cuatro bloques: emociones, cuerpo, comida y movimiento.

> El nombre es provisional. El contenido es informativo y no sustituye a un profesional sanitario. No sirve como método anticonceptivo.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Base, Supabase, auth, bienvenida manual, lógica del ciclo, pantalla Hoy y escena 3D | Hecha |
| 2 | Importar desde Clue, registro diario, Mi ciclo y personalización por reglas | Pendiente |
| 3 | PWA, push, emails y cron. Exportar y borrar cuenta | Pendiente |
| 4 | Consejos con IA en el navegador (WebLLM) | Pendiente |

## Stack

| Tecnología | Uso |
|---|---|
| React + Vite + TypeScript | Interfaz y build |
| React Three Fiber + drei + Three.js | Escena 3D |
| React Router | Rutas |
| Supabase | Auth (magic link y código) y Postgres con Row Level Security |
| Vitest + PGlite | Tests de la lógica y de las políticas RLS |
| Vercel | Hosting |

## Empezar en local

Requisitos: Node.js 20 o superior. Los comandos son para PowerShell.

```powershell
npm install
npm run dev
```

La web queda en `http://localhost:5173`.

**Sin claves de Supabase arranca en modo demo:** los datos se guardan en la pestaña del navegador, no se envía ningún correo y vale cualquier código. En la pantalla Hoy aparece una barra para saltar a cualquier estación o simular un retraso. Este modo solo existe en desarrollo y no llega al build de producción.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba los tipos y genera `dist/` |
| `npm run preview` | Sirve el build para probarlo |
| `npm test` | Tests de lógica y RLS |
| `npm run lint` | Revisa el código con ESLint |

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com). **Elige una región de la UE**: la región no se puede cambiar después.
2. Abre *SQL Editor*, pega el contenido de `supabase/migrations/20261105000000_init.sql` y ejecútalo.
3. En *Authentication > URL Configuration*, pon `http://localhost:5173` en *Site URL* y añade `http://localhost:5173/**` en *Redirect URLs*. Al desplegar, añade también la URL de producción.
4. En *Authentication > Emails*, edita las plantillas **Magic Link** y **Confirm signup** y añade el código, por ejemplo: `<p>Tu código: {{ .Token }}</p>`. Hace falta porque en iPhone el enlace se abre en Safari y no dentro de la app instalada.
5. Crea tu archivo local y rellena los dos valores, que están en *Project Settings > API*:

```powershell
Copy-Item .env.example .env.local
```

6. Reinicia `npm run dev`. El modo demo se desactiva solo.

> Hasta conectar un SMTP propio, Supabase solo envía 2 correos por hora y únicamente a miembros de tu organización. Sirve para que pruebes tú, no para usuarias reales.

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` y Vercel | URL del proyecto |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` y Vercel | Clave pública. Lo que protege los datos es RLS |

Todo lo que lleva el prefijo `VITE_` llega al navegador: nunca pongas ahí una clave secreta.

## Base de datos

Las migraciones están en `supabase/migrations/`.

| Tabla | Contenido |
|---|---|
| `profiles` | Duraciones medias, avisos, zona horaria y consentimiento. La crea un trigger al registrarse |
| `periods` | Fechas de regla. Una por usuaria y día, así reimportar no duplica |
| `daily_logs` | Registro diario: síntomas, ánimo, energía y notas |
| `push_subscriptions` | Dispositivos con avisos push |
| `notification_log` | Avisos enviados. Solo la usa el servidor |

Cada usuaria solo puede leer y escribir sus filas. Todo cuelga de `auth.users` con `on delete cascade`, de modo que borrar la cuenta borra sus datos. `tests/rls.test.ts` ejecuta las migraciones reales en un Postgres en memoria y comprueba este aislamiento.

## Lógica del ciclo

Vive en `src/lib/cycle.ts`, sin dependencias de interfaz, para poder usarla también en el cron.

- Las fechas son cadenas `YYYY-MM-DD`, sin horas, para evitar errores de zona horaria.
- La duración media se calcula con los últimos 6 ciclos cuando hay al menos 3 completos. Si no, se usa la que indicó la usuaria.
- La ovulación se estima en (duración − 14) ± 1 día. Con ciclos cortos y reglas largas, la ventana empieza el día después de la regla y la fase folicular puede quedarse sin días.
- Estados especiales: `late` (retraso), `stale` (más de 30 días de retraso, pide actualizar), `no_data`, y aviso de ciclo irregular si la variación pasa de 7 días.

## Estructura

```
├── public/                  Favicon
├── supabase/migrations/     Tablas, RLS y trigger de registro
├── tests/                   Tests del ciclo y de RLS
└── src/
    ├── components/          DialogBox, AdviceBlocks, CycleBar, SkyPanel, StaticIsland...
    ├── content/             phases.ts (consejos) y legal.ts (responsable y versión de la política)
    ├── hooks/               useSession, useCycleData, useVisible, useReveal
    ├── lib/                 cycle.ts y format.ts
    ├── pages/               Landing, Auth, Onboarding, Today, Settings, Privacy
    ├── services/            supabase.ts, auth.ts, data.ts y demo.ts
    ├── styles/index.css     Variables en :root y todos los estilos
    └── three/               Scene, Island, Mochi, Floaters, Burst, seasons, shapes, support
```

## Personalizar

| Qué quieres cambiar | Dónde |
|---|---|
| Colores y tipografías | Variables `:root` y `[data-phase]` en `src/styles/index.css` |
| Consejos de cada fase | `src/content/phases.ts` |
| Colores de cada estación y energía de Mochi | `src/three/seasons.ts` |
| Aspecto y ropa de Mochi | `src/three/Mochi.tsx` |
| Objetos de la isla | `Props` en `src/three/Island.tsx` |
| Tamaño del píxel y fps | `PIXEL_SIZE` y `FPS` en `src/three/Scene.tsx` |
| Responsable de la política de privacidad | `src/content/legal.ts` |

## Rendimiento 3D

La escena se dibuja a baja resolución y se amplía con `image-rendering: pixelated`, lo que da el aspecto retro y reduce mucho el trabajo de la GPU. Funciona a 30 fps con `frameloop="demand"`, se pausa fuera de pantalla y usa muy pocos polígonos. Three.js se descarga aparte, después del contenido. Sin WebGL o con «reducir movimiento» activado se muestra `StaticIsland`.

## Despliegue

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. Añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en *Settings > Environment Variables*.
3. Añade la URL de producción en *Redirect URLs* de Supabase.

Si un cambio toca la base de datos, ejecuta primero el SQL en Supabase y después haz push.

## Antes de abrirla al público

- Rellenar el responsable en `src/content/legal.ts` y hacer revisar la política de privacidad.
- Exportar y borrar cuenta (Fase 3) son obligatorios por RGPD.
- Conectar Resend como SMTP en Supabase, con un dominio propio verificado.
- El plan gratuito de Supabase no incluye copias de seguridad automáticas: exporta los datos con `supabase db dump` o valora el plan Pro.
