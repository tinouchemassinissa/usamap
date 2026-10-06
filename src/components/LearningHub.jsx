import { DIFFICULTY_PROFILES } from '../game/learningEngine';

export default function LearningHub({
  difficulty,
  onDifficultyChange,
  summary,
  dueCount,
  mistakeCount,
  achievements,
  records,
  classroom,
  onClassroomChange,
  classSession,
  onStartClassSession,
  onEndClassSession,
  onExportClassSession,
  focusVolume,
  onVolumeChange,
  online,
}) {
  const unlocked = achievements.filter((item) => item.unlocked);
  const topRecords = Object.entries(records)
    .filter(([, record]) => record.plays > 0)
    .sort((a, b) => (b[1].bestScore || 0) - (a[1].bestScore || 0))
    .slice(0, 5);

  return (
    <section className="learning-hub" aria-label="Learning dashboard">
      <div className="hub-status-row">
        <div>
          <span className="hub-eyebrow">LEARNING PROFILE</span>
          <strong>{summary.mastery}% mastery</strong>
          <span>{summary.accuracy}% lifetime accuracy · {summary.attempts} attempts</span>
        </div>
        <div className={'offline-pill ' + (online ? 'online' : 'offline')}>
          {online ? '● Online' : '● Offline ready'}
        </div>
      </div>

      <div className="hub-metrics">
        <div><strong>{summary.mastered}</strong><span>Mastered</span></div>
        <div><strong>{dueCount}</strong><span>Due now</span></div>
        <div><strong>{mistakeCount}</strong><span>Review states</span></div>
        <div><strong>{unlocked.length}</strong><span>Achievements</span></div>
      </div>

      <div className="hub-section">
        <div className="hub-section-title">Difficulty</div>
        <div className="difficulty-grid">
          {Object.values(DIFFICULTY_PROFILES).map((level) => (
            <button
              type="button"
              key={level.id}
              className={'difficulty-card ' + (difficulty === level.id ? 'active' : '')}
              aria-pressed={difficulty === level.id}
              onClick={() => onDifficultyChange(level.id)}
            >
              <strong>{level.label}</strong>
              <span>{level.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="hub-split">
        <div className="hub-section">
          <div className="hub-section-title">Audio</div>
          <label className="focus-volume-label">
            <span>Focus volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={focusVolume}
              onChange={onVolumeChange}
              aria-label="Focus music volume"
            />
            <span>{Math.round(focusVolume * 100)}%</span>
          </label>
          <div className="focus-track-name">Bach · Air on the G String</div>
        </div>

        <div className="hub-section">
          <div className="hub-section-title">Classroom mode</div>
          <label className="classroom-toggle">
            <input
              type="checkbox"
              checked={classroom.enabled}
              onChange={(event) => onClassroomChange({ ...classroom, enabled: event.target.checked })}
            />
            <span>Keep sessions local and off the public leaderboard</span>
          </label>
          {classroom.enabled && (
            <div className="classroom-session-panel">
              <div className="classroom-field-grid">
                <label>
                  <span>Class</span>
                  <input
                    className="classroom-name-input"
                    value={classroom.className}
                    placeholder="Example: Grade 5 - Period 2"
                    onChange={(event) => onClassroomChange({ ...classroom, className: event.target.value.slice(0, 50) })}
                    aria-label="Class name"
                  />
                </label>
                <label>
                  <span>Teacher</span>
                  <input
                    className="classroom-name-input"
                    value={classroom.teacherName}
                    placeholder="Teacher name (optional)"
                    onChange={(event) => onClassroomChange({ ...classroom, teacherName: event.target.value.slice(0, 50) })}
                    aria-label="Teacher name"
                  />
                </label>
              </div>
              <label className="classroom-session-name">
                <span>Session</span>
                <input
                  className="classroom-name-input"
                  value={classroom.sessionName}
                  placeholder="Example: Census Regions - Oct 6"
                  onChange={(event) => onClassroomChange({ ...classroom, sessionName: event.target.value.slice(0, 60) })}
                  aria-label="Class session name"
                />
              </label>

              {classSession?.id ? (
                <div className="class-session-status">
                  <div>
                    <span className="hub-eyebrow">{classSession.active ? 'ACTIVE CLASS SESSION' : 'LAST CLASS SESSION'}</span>
                    <strong>{classSession.name}</strong>
                    <small>
                      {classSession.games.length} games · {classSession.attempts.length} recorded attempts
                    </small>
                  </div>
                  <span className={'session-state-pill ' + (classSession.active ? 'active' : 'ended')}>
                    {classSession.active ? 'Recording' : 'Ended'}
                  </span>
                </div>
              ) : (
                <div className="class-session-empty">
                  Start a class session to record only the games and attempts from that lesson.
                </div>
              )}

              <div className="classroom-actions">
                <button type="button" className="classroom-session-btn" onClick={onStartClassSession}>
                  {classSession?.active ? 'Start new session' : 'Start class session'}
                </button>
                {classSession?.active && (
                  <button type="button" className="classroom-session-btn secondary" onClick={onEndClassSession}>
                    End session
                  </button>
                )}
                <button
                  type="button"
                  className="classroom-report-btn"
                  onClick={onExportClassSession}
                  disabled={!classSession?.id || (!classSession.games.length && !classSession.attempts.length)}
                >
                  Export this session to Excel (.xlsx)
                </button>
              </div>
              <div className="classroom-scope-note">
                Excel contains only this class session: session summary, games, and answer attempts. Lifetime mastery and the rest of the local database are not exported.
              </div>
            </div>
          )}
        </div>
      </div>

      <details className="hub-details">
        <summary>Achievements · {unlocked.length}/{achievements.length}</summary>
        <div className="achievement-grid">
          {achievements.map((item) => (
            <div key={item.id} className={'achievement-card ' + (item.unlocked ? 'unlocked' : '')}>
              <strong>{item.unlocked ? '✓' : '○'} {item.title}</strong>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </details>

      <details className="hub-details">
        <summary>Per-mode records</summary>
        <div className="record-grid">
          {topRecords.length ? topRecords.map(([mode, record]) => (
            <div className="record-card" key={mode}>
              <strong>{mode.replaceAll('_', ' ')}</strong>
              <span>Best {record.bestScore} · {Math.round(record.bestAccuracy)}% accuracy</span>
              <span>{record.wins} wins / {record.plays} plays</span>
            </div>
          )) : <div className="empty-hub-state">Complete a game to create your first record.</div>}
        </div>
      </details>
    </section>
  );
}
