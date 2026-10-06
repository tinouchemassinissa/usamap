export default function ModeSelector({ modes, value, onChange }) {
  return (
    <div className="mode-grid" aria-label="Game modes">
      {Object.values(modes).map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={`mode-card ${value === mode.id ? 'active' : ''}`}
          aria-pressed={value === mode.id}
          onClick={() => onChange(mode.id)}
        >
          <span className="mode-title">{mode.title}</span>
          <span className="mode-desc">{mode.desc}</span>
        </button>
      ))}
    </div>
  );
}
