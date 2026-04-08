export default function QuestionCard({
  title,
  points,
  children,
  feedback,
  isCorrect,
}) {
  return (
    <article className="question-card">
      <div className="question-head">
        <h3>{title}</h3>
        <span className="badge">{points} pts</span>
      </div>
      <div className="question-body">{children}</div>
      {feedback ? (
        <div className={`feedback ${isCorrect ? 'ok' : 'error'}`}>
          {feedback}
        </div>
      ) : null}
    </article>
  )
}