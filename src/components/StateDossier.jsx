import { getNeighbors } from '../game/geography';

export default function StateDossier({ stateName, data, stats, onClose }) {
  if (!stateName || !data) return null;
  const neighbors = getNeighbors(stateName);
  const accuracy = stats?.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;
  const mastery = Math.round((stats?.mastery || 0) * 100);

  return (
    <div className="overlay dossier-overlay">
      <article className="glass-panel state-dossier" role="dialog" aria-modal="true" aria-label={stateName + ' learning dossier'}>
        <button className="dossier-close" type="button" onClick={onClose} aria-label="Close dossier">×</button>
        <header className="dossier-header">
          <img src={'https://flagcdn.com/w320/us-' + data.code + '.png'} alt={stateName + ' flag'} />
          <div>
            <span className="hub-eyebrow">{data.region} · {data.code.toUpperCase()}</span>
            <h2>{stateName}</h2>
            <p>{data.geography}</p>
          </div>
        </header>

        <div className="dossier-stat-grid">
          <div><span>Capital</span><strong>{data.capital}</strong></div>
          <div><span>Population</span><strong>{data.population}</strong></div>
          <div><span>Area</span><strong>{data.area}</strong></div>
          <div><span>Statehood</span><strong>{data.statehood}</strong></div>
          <div><span>Your mastery</span><strong>{mastery}%</strong></div>
          <div><span>Your accuracy</span><strong>{stats?.attempts ? accuracy + '%' : 'New'}</strong></div>
        </div>

        <section className="dossier-section">
          <h3>Bordering states</h3>
          <p>{neighbors.length ? neighbors.join(' · ') : 'No land borders with another U.S. state.'}</p>
        </section>

        <section className="dossier-section">
          <h3>Remember this</h3>
          <p>{data.fact}</p>
        </section>

        <section className="dossier-section dossier-learning">
          <h3>Your learning history</h3>
          <p>
            {stats?.attempts || 0} attempts · {stats?.mistakes || 0} mistakes ·
            {' '}{stats?.correctStreak || 0} correct in a row
          </p>
          {stats?.nextReview && <p>Next scheduled review: {new Date(stats.nextReview).toLocaleDateString()}</p>}
        </section>
      </article>
    </div>
  );
}
