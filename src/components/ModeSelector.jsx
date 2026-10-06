const GROUPS = [
  { id: 'learn', label: 'Learn', modes: ['ADAPTIVE', 'MISTAKES', 'STUDY'] },
  { id: 'challenge', label: 'Challenge', modes: ['CLASSIC', 'TIME_ATTACK', 'REVERSE', 'CAPITALS', 'TRIVIA', 'FLAGS', 'MIXED', 'NEIGHBORS', 'JOURNEY'] },
  { id: 'explore', label: 'Explore', modes: ['REGIONS'] },
];

export default function ModeSelector({ modes, value, onChange }) {
  return (
    <div className="mode-groups" aria-label="Game modes">
      {GROUPS.map((group) => {
        const available = group.modes.map((id) => modes[id]).filter(Boolean);
        if (!available.length) return null;
        return (
          <section key={group.id} className="mode-group" aria-label={group.label + ' modes'}>
            <div className="mode-group-label">{group.label}</div>
            <div className="mode-grid">
              {available.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={'mode-card ' + (value === mode.id ? 'active' : '')}
                  aria-pressed={value === mode.id}
                  onClick={() => onChange(mode.id)}
                >
                  <span className="mode-title">{mode.title}</span>
                  <span className="mode-desc">{mode.desc}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
