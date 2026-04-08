export default function StudentForm({ student, onChange }) {
  return (
    <section className="panel">
      <h2>1. Identificación del estudiante</h2>
      <div className="grid two">
        <label className="field">
          <span>Nombre completo</span>
          <input
            type="text"
            value={student.name}
            onChange={(e) => onChange({ ...student, name: e.target.value })}
            placeholder="Escribe tu nombre"
          />
        </label>

        <label className="field">
          <span>ID o código</span>
          <input
            type="text"
            value={student.id}
            onChange={(e) => onChange({ ...student, id: e.target.value })}
            placeholder="Ej. 2026001"
          />
        </label>
      </div>
    </section>
  )
}