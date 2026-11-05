import { Link } from "react-router-dom"
import { CONTROLLER, MIN_AGE, PRIVACY_VERSION } from "../content/legal"

export default function Privacy() {
  return (
    <main className="narrow-page prose">
      <Link to="/" className="brand">
        Isla Mochi
      </Link>
      <h1 className="page-title">Política de privacidad</h1>
      <p className="notice">
        Borrador pendiente de revisión legal. Versión {PRIVACY_VERSION}.
      </p>

      <h2>Quién trata tus datos</h2>
      <p>
        Responsable: {CONTROLLER.name}. Contacto: {CONTROLLER.email}.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>Tu email y, si lo indicas, tu nombre.</li>
        <li>Datos de salud: fechas de regla, duración del ciclo, síntomas, ánimo, energía y notas.</li>
        <li>Tus preferencias de avisos y tu zona horaria.</li>
        <li>La fecha y la versión de tu consentimiento.</li>
      </ul>
      <p>Solo pedimos lo necesario para que la app funcione.</p>

      <h2>Para qué y con qué base legal</h2>
      <p>
        Los usamos solo para mostrarte información sobre tu ciclo y enviarte los avisos que elijas. La base legal es
        tu consentimiento explícito (artículos 6.1.a y 9.2.a del RGPD). No vendemos tus datos ni los usamos para
        publicidad.
      </p>

      <h2>Quién más interviene</h2>
      <ul>
        <li>Supabase: base de datos y acceso a la cuenta.</li>
        <li>Vercel: alojamiento de la web y envío programado de avisos.</li>
        <li>Resend: envío de correos, solo si activas los avisos por email.</li>
        <li>El servicio de notificaciones de tu navegador, solo si activas los avisos push.</li>
      </ul>
      <p>
        Actúan como encargados del tratamiento. Algunos pueden tratar datos fuera de la Unión Europea, con las
        garantías que exige el RGPD.
      </p>

      <h2>Consejos con IA</h2>
      <p>
        Si activas esta opción, el modelo se ejecuta en tu propio dispositivo y tus datos no se envían a ningún
        servicio de IA externo. El modelo se descarga una vez desde Hugging Face. Esa descarga no incluye tus datos.
      </p>

      <h2>Cuánto tiempo</h2>
      <p>Guardamos tus datos mientras tengas la cuenta. Al borrarla se eliminan todos.</p>

      <h2>Tus derechos</h2>
      <p>
        Puedes acceder a tus datos, corregirlos, exportarlos, borrarlos y retirar tu consentimiento en cualquier
        momento desde Ajustes o escribiendo a {CONTROLLER.email}. Si crees que no los tratamos bien, puedes reclamar ante la Agencia
        Española de Protección de Datos (aepd.es).
      </p>

      <h2>Edad mínima</h2>
      <p>Debes tener {MIN_AGE} años o más para usar Isla Mochi.</p>
    </main>
  )
}
