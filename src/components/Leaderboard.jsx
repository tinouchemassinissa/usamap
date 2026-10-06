export default function Leaderboard({ entries, title = '🌍 Global Leaderboard', limit = 5, showMode = false }) {
  if (!entries.length) return null;

  return (
    <section className="leaderboard-panel" aria-label={title.replace(/^\S+\s*/, '')}>
      <h3>{title}</h3>
      {entries.slice(0, limit).map((entry, index) => (
        <div key={entry.id} className="leaderboard-row">
          <span>
            {index + 1}. {entry.name}
            {showMode && <span className="leaderboard-mode"> ({entry.mode})</span>}
          </span>
          <strong>{entry.score} pts</strong>
        </div>
      ))}
    </section>
  );
}
