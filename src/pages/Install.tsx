import { Link } from "react-router-dom"

export default function Install() {
  return (
    <main className="narrow-page prose">
      <Link to="/ajustes" className="brand">
        Volver
      </Link>
      <h1 className="page-title">Instala Isla Mochi</h1>
      <p>
        Instalada funciona como una app, con su icono en la pantalla de inicio. En iPhone es imprescindible para recibir
        notificaciones.
      </p>

      <section className="paper-box">
        <h2>En iPhone (iOS 16.4 o superior)</h2>
        <ol className="install-steps">
          <li>Abre esta web con Safari.</li>
          <li>Pulsa el botón Compartir, el cuadrado con una flecha hacia arriba.</li>
          <li>Elige «Añadir a pantalla de inicio» y confirma.</li>
          <li>Abre Isla Mochi desde el icono nuevo, no desde Safari.</li>
          <li>Entra en Ajustes y activa las notificaciones.</li>
        </ol>
      </section>

      <section className="paper-box">
        <h2>En Android</h2>
        <ol className="install-steps">
          <li>Abre esta web con Chrome.</li>
          <li>Pulsa el menú de los tres puntos, arriba a la derecha.</li>
          <li>Elige «Instalar aplicación» o «Añadir a pantalla de inicio».</li>
          <li>Abre Isla Mochi y activa las notificaciones en Ajustes.</li>
        </ol>
      </section>

      <p className="notice">
        Al entrar desde la app instalada en iPhone, usa el código de 6 dígitos del correo: el enlace se abriría en Safari.
      </p>
    </main>
  )
}
