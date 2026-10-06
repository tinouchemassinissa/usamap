export default function LearningProgress({ percent, mastered, total = 50 }) {
  return (
    <section
      className="learning-progress"
      aria-label={`Learning mastery ${percent} percent; ${mastered} of ${total} states mastered`}
    >
      <div className="learning-progress-row">
        <span>Learning mastery</span>
        <strong>{percent}% · {mastered}/{total} mastered</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
