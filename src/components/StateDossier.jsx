import { getNeighbors } from '../game/geography';

function SourceLink({ source, label }) {
  if (!source?.url) return null;
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="dossier-source-link">
      <span>{label}</span>
      <small>{source.agency} · {source.yearLabel}</small>
    </a>
  );
}

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
            <span className="hub-eyebrow">
              Census {data.region} · {data.division} · FIPS {data.fips}
            </span>
            <h2>{stateName}</h2>
            <p>{data.geography}</p>
          </div>
        </header>

        <div className="dossier-stat-grid">
          <div>
            <span>Capital</span>
            <strong>{data.capital}</strong>
          </div>
          <div>
            <span>Population · V2025</span>
            <strong>{data.population}</strong>
          </div>
          <div>
            <span>Total area · Census 2010</span>
            <strong>{data.area}</strong>
          </div>
          <div>
            <span>Census region</span>
            <strong>{data.region}</strong>
          </div>
          <div>
            <span>Census division</span>
            <strong>{data.division}</strong>
          </div>
          <div>
            <span>Statehood</span>
            <strong>{data.statehood}</strong>
          </div>
          <div>
            <span>Your mastery</span>
            <strong>{mastery}%</strong>
          </div>
          <div>
            <span>Your accuracy</span>
            <strong>{stats?.attempts ? accuracy + '%' : 'New'}</strong>
          </div>
          <div>
            <span>Postal / FIPS</span>
            <strong>{data.code.toUpperCase()} / {data.fips}</strong>
          </div>
        </div>

        <section className="dossier-section">
          <h3>Bordering states</h3>
          <p>{neighbors.length ? neighbors.join(' · ') : 'No land borders with another U.S. state.'}</p>
        </section>

        <section className="dossier-section">
          <h3>Remember this</h3>
          <p>{data.verifiedFact || data.fact}</p>
          {data.audit?.legacyFact?.startsWith('quarantined') && (
            <p className="audit-note">
              Older unsourced fun facts are excluded from the verified learning layer until individually checked against authoritative sources.
            </p>
          )}
        </section>

        <section className="dossier-section official-sources">
          <h3>Official sources</h3>
          <div className="dossier-source-grid">
            <SourceLink source={data.sources?.censusGeography} label="Census region & division" />
            <SourceLink source={data.sources?.studentFacts} label="Student facts & state symbols" />
            <SourceLink source={data.sources?.population} label="Population estimate" />
            <SourceLink source={data.sources?.area} label="Area measurement" />
            <SourceLink source={data.sources?.landmarkDirectory} label="National Park Service sites" />
            <SourceLink source={data.sources?.statehood} label="Statehood archives" />
          </div>
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
