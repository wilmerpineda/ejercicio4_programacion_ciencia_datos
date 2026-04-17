import { useMemo, useState, useEffect } from 'react'
import { buildExercise } from './exercises'
import { evaluateCode } from './evaluator'
import UniversityHeader from './components/UniversityHeader'

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
const MAX_ATTEMPTS = 5

function getAttemptKey(email) {
  return `oop_attempt_count_${email.trim().toLowerCase()}`
}

async function submitAttempt(payload) {
  if (!APPS_SCRIPT_URL) {
    return {
      ok: false,
      message: 'No está configurada la URL del Apps Script',
    }
  }

  try {
    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData,
    })

    const text = await response.text()

    let result
    try {
      result = JSON.parse(text)
    } catch {
      throw new Error(`Respuesta no válida: ${text}`)
    }

    return {
      ok: !!result.ok,
      message: result.ok
        ? 'Intento enviado correctamente a Google Sheets.'
        : `Error: ${result.error || 'desconocido'}`,
    }
  } catch (error) {
    console.error('Error en submitAttempt:', error)
    return {
      ok: false,
      message: `Error de conexión con Google Sheets: ${String(error)}`,
    }
  }
}

export default function App() {
  const [email, setEmail] = useState('')
  const [isStarted, setIsStarted] = useState(false)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const [submittedCode, setSubmittedCode] = useState('')
  const [sending, setSending] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const normalizedEmail = email.trim().toLowerCase()
  const attemptUsed = attemptCount >= MAX_ATTEMPTS

  useEffect(() => {
    if (!normalizedEmail) {
      setAttemptCount(0)
      setSubmittedCode('')
      return
    }

    const attemptKey = getAttemptKey(normalizedEmail)
    const storedCount = Number(localStorage.getItem(attemptKey) || '0')
    const storedCode = localStorage.getItem(`${attemptKey}_code`) || ''

    setAttemptCount(storedCount)
    setSubmittedCode(storedCode)
  }, [normalizedEmail])

  const exercise = useMemo(() => {
    if (!isStarted || !normalizedEmail) return null
    return buildExercise(normalizedEmail)
  }, [isStarted, normalizedEmail])

  function handleStart() {
    if (!normalizedEmail.includes('@')) return
    setIsStarted(true)
  }

  async function handleEvaluate() {
    if (!exercise || attemptUsed || !code.trim()) return

    const evaluation = evaluateCode(code, exercise)
    setResult(evaluation)

    const partialScorePct = Number(((evaluation.score / 100) * 30).toFixed(2))

    const payload = {
      student_email: normalizedEmail,
      exercise_id: exercise.id,
      exercise_title: exercise.title,
      attempt_status: 'submitted',
      partial_score: evaluation.score,
      partial_score_pct: partialScorePct,
      code_submission: code,
      auto_feedback: evaluation.feedback,
      example_data_json: exercise.data,
      expected_outputs_json: exercise.examples,
      manual_review_status: 'pending',
      final_score_70: '',
      final_score_total: '',
      review_notes: '',
    }

    setSending(true)
    setSubmitStatus(null)

    try {
      const submitResult = await submitAttempt(payload)
      setSubmitStatus(submitResult)

      if (submitResult.ok) {
        const attemptKey = getAttemptKey(normalizedEmail)
        const newCount = attemptCount + 1

        localStorage.setItem(attemptKey, String(newCount))
        localStorage.setItem(`${attemptKey}_code`, code)

        setAttemptCount(newCount)
        setSubmittedCode(code)
      }
    } catch (error) {
      setSubmitStatus({
        ok: false,
        message: `No fue posible enviar el intento: ${String(error)}`,
      })
    } finally {
      setSending(false)
    }
  }

  if (!isStarted) {
    return (
      <main className="app-shell">
        <UniversityHeader />

        <section className="panel">
          <h2>Inicio del ejercicio</h2>

          <div className="context-text">
            {`Este ejercicio es personalizado y se genera una única vez a partir de tu correo electrónico.

La retroalimentación automática que entrega la plataforma corresponde a una nota parcial del 30%.
Esta parte evalúa aspectos como estructura de clases, uso de Programación Orientada a Objetos,
tipado, documentación y señales iniciales de lógica.

El 70% restante se calificará posteriormente con pruebas adicionales más exigentes sobre el código
que entregues. Esas pruebas utilizarán más datos, más escenarios y validaciones complementarias,
con el objetivo de evaluar la robustez completa de tu solución.

Importante:
- Dispones de hasta ${MAX_ATTEMPTS} intentos en esta plataforma.
- El correo electrónico será usado como identificador para generar tu versión del ejercicio.
- Una vez alcances el límite de intentos, la evaluación automática quedará cerrada para este correo en este navegador.`}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label className="field">
              <span>Correo electrónico</span>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          {normalizedEmail && attemptUsed && (
            <div className="result-box" style={{ marginTop: '1rem' }}>
              <h4>Límite de intentos alcanzado</h4>
              <p>
                Para este correo ya se alcanzó el número máximo de intentos permitidos en este navegador.
                El ejercicio seguirá siendo el mismo, pero la evaluación automática ya no podrá enviarse nuevamente.
              </p>
            </div>
          )}

          <button
            className="primary-btn"
            onClick={handleStart}
            disabled={!normalizedEmail.includes('@')}
          >
            Generar ejercicio
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <UniversityHeader />

      <section className="panel">
        <h2>{exercise.title}</h2>
        <div className="context-text">{exercise.context}</div>
      </section>

      <section className="panel">
        <h3>Condiciones de evaluación</h3>
        <div className="context-text">
          {`Retroalimentación automática en plataforma: 30%
Evaluación posterior con pruebas adicionales: 70%

La nota que se muestra aquí es parcial. Tu código será revisado posteriormente con más casos de prueba
y mayor cantidad de datos para verificar la solidez completa de la implementación.`}
        </div>
      </section>

      <section className="panel">
        <h3>Datos del caso</h3>
        <pre>{JSON.stringify(exercise.data, null, 2)}</pre>
      </section>

      <section className="panel">
        <h3>Esqueleto base</h3>
        <pre>{exercise.skeleton}</pre>
      </section>

      <section className="panel">
        <h3>Comportamiento esperado sobre el caso mostrado</h3>
        <p>
          Para que no trabajes a ciegas, aquí se muestran las salidas esperadas
          cuando se llaman los métodos sobre los datos del ejemplo.
        </p>

        <div className="examples-grid">
          {exercise.examples.map((example, index) => (
            <div className="example-card" key={`${example.call}-${index}`}>
              <code>{example.call}</code>
              <div className="example-output">{example.output}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Escribe tu solución</h3>
        <p>
          Completa la implementación de la clase. Cada envío exitoso consumirá un intento.
          Intentos usados: <strong>{attemptCount}</strong> de <strong>{MAX_ATTEMPTS}</strong>.
        </p>

        <textarea
          className="code-editor"
          value={attemptUsed ? submittedCode : code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Escribe aquí tu clase en Python..."
          disabled={attemptUsed}
        />

        <div style={{ marginTop: '1rem' }}>
          <button
            className="primary-btn"
            onClick={handleEvaluate}
            disabled={attemptUsed || !code.trim() || sending}
          >
            {attemptUsed
              ? 'Límite de intentos alcanzado'
              : sending
              ? 'Enviando...'
              : 'Evaluar código'}
          </button>
        </div>

        {submitStatus && (
          <div className="result-box" style={{ marginTop: '1rem' }}>
            <strong>{submitStatus.ok ? 'Estado:' : 'Error:'}</strong>{' '}
            {submitStatus.message}
          </div>
        )}
      </section>

      {attemptUsed && !result && (
        <section className="panel">
          <h3>Intentos cerrados</h3>
          <p>
            Ya alcanzaste el número máximo de intentos permitidos para este correo en este navegador.
            La solución mostrada arriba corresponde al último código guardado localmente.
          </p>
        </section>
      )}

      {result && (
        <section className="panel">
          <h3>Retroalimentación automática (30%)</h3>

          <div className="score-box">
            <span>Puntaje parcial</span>
            <strong>{result.score} / 100</strong>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4>Observaciones</h4>
            <ul>
              {result.feedback.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="result-box" style={{ marginTop: '1rem' }}>
            <strong>Recuerda:</strong> este resultado corresponde solo al 30% de la nota.
            El 70% restante se obtendrá cuando tu solución sea sometida a pruebas adicionales
            con más datos y escenarios.
          </div>
        </section>
      )}
    </main>
  )
}
