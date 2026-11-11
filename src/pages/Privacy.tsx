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
        <li>Brevo: envío de los correos de acceso y, si los activas, de los avisos por email.</li>
        <li>El servicio de notificaciones de tu navegador, solo si activas los avisos push.</li>
        <li>Groq: el servicio de IA en la nube, solo si activas los consejos y el chat con IA.</li>
      </ul>
      <p>
        Actúan como encargados del tratamiento. Algunos pueden tratar datos fuera de la Unión Europea, con las
        garantías que exige el RGPD.
      </p>

      <h2>Consejos y chat con IA</h2>
      <p>
        Es opcional y necesita tu permiso expreso, que puedes retirar en Ajustes cuando quieras. Si lo activas, para
        escribirte consejos o responder tus preguntas enviamos a Groq (un servicio de IA en la nube, con servidores en
        Estados Unidos) solo lo necesario: tu fase, el día del ciclo, la duración media de tu ciclo y lo que hayas
        registrado los últimos días (síntomas, ánimo y energía), además de tus mensajes del chat. Nunca enviamos tu
        nombre, tu email, tus notas ni identificadores de tu cuenta.
      </p>
      <p>
        El servicio está configurado para no conservar lo que le enviamos. Nosotros no guardamos las conversaciones:
        se quedan solo en tu dispositivo, igual que los últimos consejos. En nuestra base de datos solo anotamos cuántas
        consultas haces cada día, para aplicar el límite gratuito, y la fecha en que diste el permiso.
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
