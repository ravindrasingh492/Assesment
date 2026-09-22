import { useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DrugCard from '../components/DrugCard'
import { useSearch } from '../hooks/useSearch'
import { getDrugSlug } from '../drug'

const EXAMPLES = ['Advil', 'Tylenol', 'Lipitor', 'Amoxil', 'Zithromax']

// skeleton grid shown while fetching
function SkeletonGrid() {
  const rows = [
    ['58%', '38%', '80%', '65%'],
    ['62%', '42%', '72%', '55%'],
    ['55%', '35%', '85%', '70%'],
    ['65%', '45%', '75%', '60%'],
    ['52%', '40%', '78%', '68%'],
    ['60%', '36%', '82%', '62%'],
  ]
  return (
    <div className="skel-grid">
      {rows.map((ws, i) => (
        <div className="skel-card" key={i}>
          <div className="skel-line" style={{ height: 15, width: ws[0] }} />
          <div className="skel-line" style={{ height: 11, width: ws[1] }} />
          <div className="skel-line" style={{ height: 11, width: ws[2] }} />
          <div className="skel-line" style={{ height: 11, width: ws[3] }} />
          <div className="skel-line" style={{ height: 11, width: '48%' }} />
        </div>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef      = useRef(null)
  const {
    inputVal, setInputVal,
    lastQuery,
    results,
    status,
    errorMsg,
    search,
    onInputChange,
    clear,
  } = useSearch()

  // if we came back from the detail page via ?q=..., restore and run the search
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setInputVal(q)
      search(q)
    }
  // only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCardClick = useCallback((drug) => {
    const slug = getDrugSlug(drug)
    // pass the full drug object in router state so the detail page
    // doesn't need to re-fetch if we're coming from here
    navigate(`/drug/${slug}`, { state: { drug, fromQuery: lastQuery } })
  }, [navigate, lastQuery])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">MediSearch</span>
        <span className="topbar-sub">Drug label lookup — FDA openFDA</span>
      </div>

      <div className="container">
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
              onKeyDown={handleKeyDown}
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
            {EXAMPLES.map(ex => (
              <button key={ex} className="q-chip" onClick={() => search(ex)}>{ex}</button>
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
                <DrugCard
                  key={i}
                  drug={drug}
                  onClick={() => handleCardClick(drug)}
                />
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
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => search(ex)}>{ex}</button>
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
