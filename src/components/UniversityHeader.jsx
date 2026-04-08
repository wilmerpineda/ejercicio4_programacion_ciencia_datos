export default function UniversityHeader() {
  return (
    <header className="usta-header">
      <div className="usta-header__content">
        <div className="usta-header__brand">
          <img
            src="/branding/logo_santoto.png"
            alt="Universidad Santo Tomás"
            className="usta-header__logo"
          />
        </div>

        <div className="usta-header__text">
          <h1 className="usta-header__title">
            Programación para Ciencia de Datos
          </h1>
          <p className="usta-header__subtitle">
            Ejercicio 4: Práctica de Programación Orientada a Objetos
          </p>
        </div>
      </div>

      <div className="usta-header__divider" />
    </header>
  )
}