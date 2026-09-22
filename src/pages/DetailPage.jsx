import { useEffect, useState, useMemo } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getFirst, getAll, formatProductType, clip } from '../drug'
import { isCached, getCached } from '../cache'

const BASE = 'https://api.fda.gov/drug/label.json'

// loads drug data — either from router state, cache, or a fresh API call
async function loadDrug(brandSlug, signal) {
  const decodedBrand = decodeURIComponent(brandSlug)

  // check our search cache first
  const cacheKey = decodedBrand
  if (isCached(cacheKey)) {
    const cached = getCached(cacheKey)
    if (cached.length) return { drug: cached[0], error: null }
  }

  // nothing in cache — fetch directly
  const url = `${BASE}?search=openfda.brand_name:"${encodeURIComponent(decodedBrand)}"&limit=1`
  const res  = await fetch(url, { signal })

  if (res.status === 404) return { drug: null, error: 'not_found' }
  if (!res.ok)            return { drug: null, error: `HTTP ${res.status}` }

  const data = await res.json()
  const hit  = data?.results?.[0]
  if (!hit) return { drug: null, error: 'not_found' }

  return { drug: hit, error: null }
}

// ── Detail row inside the page ─────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

// ── Text section (indications, warnings, etc.) ─────────────────────────────
function Section({ title, text, variant }) {
  if (!text) return null
  return (
    <div className="detail-section">
      <div className="section-title">{title}</div>
      <div className={`section-text${variant ? ' ' + variant : ''}`}>{text}</div>
    </div>
  )
}

// ── The actual detail view ─────────────────────────────────────────────────
function DrugDetail({ drug }) {
  const fda = drug.openfda || {}

  const brand      = getFirst(fda.brand_name)       || 'Unknown'
  const generic    = getFirst(fda.generic_name)
  const mfr        = getAll(fda.manufacturer_name).join('; ')
  const ptype      = formatProductType(fda.product_type)
  const routes     = getAll(fda.route).map(r => r.toLowerCase()).join(', ')
  const substances = getAll(fda.substance_name).join(', ')
  const pharmClass = getAll(fda.pharm_class_epc).join('; ')
  const appNum     = getFirst(fda.application_number)
  const ndc        = getAll(fda.product_ndc).slice(0, 3).join(', ')
  const splId      = getFirst(fda.spl_id)

  // root-level label sections
  const sections = [
    { title: 'Indications & Usage',     key: 'indications_and_usage',    variant: '' },
    { title: 'Dosage & Administration', key: 'dosage_and_administration', variant: '' },
    { title: 'Description',             key: 'description',               variant: '' },
    { title: 'Warnings',                key: 'warnings',                  variant: 'warn' },
    { title: 'Boxed Warning',           key: 'boxed_warning',             variant: 'warn' },
    { title: 'Contraindications',       key: 'contraindications',         variant: 'warn' },
    { title: 'Adverse Reactions',       key: 'adverse_reactions',         variant: 'danger' },
    { title: 'Drug Interactions',       key: 'drug_interactions',         variant: 'warn' },
    { title: 'Overdosage',              key: 'overdosage',                variant: 'danger' },
    { title: 'How Supplied',            key: 'how_supplied',              variant: '' },
    { title: 'Storage & Handling',      key: 'storage_and_handling',      variant: '' },
  ]

  return (
    <div>
      {/* drug header */}
      <div className="detail-header">
        <div className="detail-brand">{brand}</div>
        {generic && <div className="detail-generic">{generic}</div>}
        <div className="detail-badges">
          {ptype && (
            <span className={`card-type ${ptype === 'OTC' ? 'type-otc' : 'type-rx'}`}>
              {ptype}
            </span>
          )}
          {routes && <span className="route-tag">{routes}</span>}
        </div>
      </div>

      {/* quick info grid */}
      <div className="detail-meta">
        <InfoRow label="Generic name"           value={generic} />
        <InfoRow label="Active substances"      value={substances || null} />
        <InfoRow label="Pharmacological class"  value={pharmClass || null} />
        <InfoRow label="Manufacturer"           value={mfr || null} />
        <InfoRow label="Application #"          value={appNum} />
        <InfoRow label="NDC"                    value={ndc || null} />
        <InfoRow label="SPL ID"                 value={splId} />
      </div>

      {/* full label sections */}
      <div className="detail-sections">
        {sections.map(({ title, key, variant }) => (
          <Section
            key={key}
            title={title}
            text={clip(getFirst(drug[key]), 1200)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function DetailPage() {
  const { brandSlug }  = useParams()
  const location       = useLocation()
  const navigate       = useNavigate()

  // drug passed via router state (navigating from search results)
  const passedDrug     = location.state?.drug ?? null
  const fromQuery      = location.state?.fromQuery ?? null

  const [drug,    setDrug]    = useState(passedDrug)
  const [loading, setLoading] = useState(!passedDrug)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    // already have the drug from router state — no fetch needed
    if (passedDrug) return

    // direct URL access or page refresh — need to fetch
    const controller = new AbortController()

    setLoading(true)
    loadDrug(brandSlug, controller.signal).then(({ drug: fetched, error: err }) => {
      setDrug(fetched)
      setError(err)
      setLoading(false)
    })

    return () => controller.abort()
  }, [brandSlug, passedDrug])

  function goBack() {
    if (fromQuery) {
      // go back to search with the original query pre-filled
      navigate(`/?q=${encodeURIComponent(fromQuery)}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="back-btn" onClick={goBack}>
          ← {fromQuery ? `Results for "${fromQuery}"` : 'Search'}
        </button>
      </div>

      <div className="container">
        {loading && (
          <div className="state-box">
            <p style={{ color: '#888' }}>Loading…</p>
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="state-box">
            <h3>Medicine not found</h3>
            <p>
              Couldn't find a drug label for "{decodeURIComponent(brandSlug)}".
              This can happen if the brand name doesn't exist in the FDA database,
              or if it's spelled differently.
            </p>
            <button className="s-btn" onClick={goBack} style={{ marginTop: 8 }}>
              Go back to search
            </button>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="state-box">
            <h3>Couldn't load this page</h3>
            <p>API error: <em>{error}</em></p>
            <button className="s-btn" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && drug && <DrugDetail drug={drug} />}
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
