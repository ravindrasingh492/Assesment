import { useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DrugCard from '../components/DrugCard'
import { useSearch } from '../hooks/useSearch'
import { getDrugSlug } from '../drug'

const QUICK_SEARCHES = ['Advil', 'Tylenol', 'Lipitor', 'Amoxil', 'Zithromax']

function SkeletonGrid() {
  return (
    <div className="skel-grid">
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '55%' }} />
        <div className="skel-line" style={{ height: 11, width: '35%' }} />
        <div className="skel-line" style={{ height: 11, width: '80%' }} />
        <div className="skel-line" style={{ height: 11, width: '65%' }} />
        <div className="skel-line" style={{ height: 11, width: '50%' }} />
      </div>
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '62%' }} />
        <div className="skel-line" style={{ height: 11, width: '42%' }} />
        <div className="skel-line" style={{ height: 11, width: '75%' }} />
        <div className="skel-line" style={{ height: 11, width: '58%' }} />
        <div className="skel-line" style={{ height: 11, width: '45%' }} />
      </div>
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '48%' }} />
        <div className="skel-line" style={{ height: 11, width: '30%' }} />
        <div className="skel-line" style={{ height: 11, width: '85%' }} />
        <div className="skel-line" style={{ height: 11, width: '70%' }} />
        <div className="skel-line" style={{ height: 11, width: '52%' }} />
      </div>
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '60%' }} />
        <div className="skel-line" style={{ height: 11, width: '38%' }} />
        <div className="skel-line" style={{ height: 11, width: '78%' }} />
        <div className="skel-line" style={{ height: 11, width: '62%' }} />
        <div className="skel-line" style={{ height: 11, width: '48%' }} />
      </div>
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '53%' }} />
        <div className="skel-line" style={{ height: 11, width: '40%' }} />
        <div className="skel-line" style={{ height: 11, width: '72%' }} />
        <div className="skel-line" style={{ height: 11, width: '55%' }} />
        <div className="skel-line" style={{ height: 11, width: '43%' }} />
      </div>
      <div className="skel-card">
        <div className="skel-line" style={{ height: 15, width: '58%' }} />
        <div className="skel-line" style={{ height: 11, width: '36%' }} />
        <div className="skel-line" style={{ height: 11, width: '82%' }} />
        <div className="skel-line" style={{ height: 11, width: '67%' }} />
        <div className="skel-line" style={{ height: 11, width: '49%' }} />
      </div>
    </div>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef(null)
  const { inputVal, setInputVal, lastQuery, results, status, errorMsg, search, onInputChange, clear } = useSearch()

  // restore previous query when coming back from the detail page
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setInputVal(q)
      search(q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCardClick = useCallback((drug) => {
    const slug = getDrugSlug(drug)
    navigate(`/drug/${slug}`, { state: { drug, fromQuery: lastQuery } })
  }, [navigate, lastQuery])

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">MediSearch</span>
        <span className="topbar-sub">Drug label lookup — FDA openFDA</span>
      </div>

      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {lastQuery ? (
            <>
              <button type="button" className="bc-link" onClick={() => { clear(); navigate('/') }}>Home</button>
              <span className="bc-sep">/</span>
              <span className="bc-current">Search: {lastQuery}</span>
            </>
          ) : (
            <span className="bc-current">Home</span>
          )}
        </nav>

        <div className="search-box">
          <label htmlFor="main-search">Brand name</label>
          <p className="search-hint-text">
            Looks up drug labels from the FDA database. Starts searching after you stop
            typing, or hit the button.
          </p>
          <div className="input-row">
            <input
              id="main-search"
              ref={inputRef}
              type="text"
              className="s-input"
              placeholder="e.g. Advil"
              value={inputVal}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              autoComplete="off"
            />
            <button
              id="search-submit"
              className="s-btn"
              onClick={() => search()}
              disabled={!inputVal.trim() || status === 'loading'}
            >
              {status === 'loading' ? 'Loading…' : 'Search'}
            </button>
          </div>
          <div className="quick-links">
            <span>Quick:</span>
            {QUICK_SEARCHES.map(q => (
              <button key={q} className="q-chip" onClick={() => search(q)}>{q}</button>
            ))}
            {inputVal && status !== 'loading' && (
              <button className="q-clear" onClick={() => { clear(); inputRef.current?.focus() }}>
                clear
              </button>
            )}
          </div>
        </div>

        {status === 'loading' && <SkeletonGrid />}

        {status === 'success' && (
          <div>
            <div className="result-bar">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{lastQuery}"
            </div>
            <div className="results-grid">
              {results.map((drug, i) => (
                <DrugCard key={i} drug={drug} onClick={() => handleCardClick(drug)} />
              ))}
            </div>
          </div>
        )}

        {status === 'empty' && (
          <div className="state-box">
            <h3>No results for "{lastQuery}"</h3>
            <p>
              The FDA API didn't return anything for that brand name. Try a
              different spelling, or pick one below.
            </p>
            <div className="chips">
              {QUICK_SEARCHES.map(q => (
                <button key={q} onClick={() => search(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="state-box">
            <h3>Something went wrong</h3>
            <p>
              API error: <em>{errorMsg}</em><br />
              Check your connection and try again.
            </p>
            <button className="s-btn" style={{ marginTop: 8 }} onClick={() => search(lastQuery)}>
              Retry
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="intro-box">
            <p>
              This app lets you search for drug labels using the FDA openFDA API.
              Type a brand name above — it'll start searching automatically after
              you stop typing.
            </p>
            <p>Each card shows:</p>
            <ul>
              <li>Brand name and generic name</li>
              <li>Whether it's OTC or prescription only</li>
              <li>Route of administration (oral, topical, etc.)</li>
              <li>Active substances</li>
              <li>Pharmacological class (when available)</li>
              <li>Manufacturer</li>
            </ul>
            <br />
            <p style={{ color: '#aaa', fontSize: '12px' }}>
              Note: the API returns a 404 when a brand name isn't in the database —
              that just means no results, not a server error.
            </p>
          </div>
        )}
      </div>

      <footer>
        Data from the{' '}
        <a href="https://open.fda.gov/apis/drug/label/" target="_blank" rel="noreferrer">
          FDA openFDA Drug Label API
        </a>
        . Not medical advice.
      </footer>
    </div>
  )
}
