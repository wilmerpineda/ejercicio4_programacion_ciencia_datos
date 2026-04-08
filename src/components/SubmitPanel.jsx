export default function SubmitPanel({
  score,
  maxScore,
  onSubmit,
  sending,
  submitResult,
  canSubmit,
}) {
  return (
    <section className="panel">
      <h2>4. Envío del intento</h2>
      <p>
        Puntaje actual: <strong>{score}</strong> / {maxScore}
      </p>
      <button className="primary-btn" onClick={onSubmit} disabled={!canSubmit || sending}>
        {sending ? 'Enviando...' : 'Enviar intento'}
      </button>

      {submitResult ? (
        <p className={submitResult.ok ? 'status ok' : 'status error'}>
          {submitResult.message}
        </p>
      ) : null}
    </section>
  )
}