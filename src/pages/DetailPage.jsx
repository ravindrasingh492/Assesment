import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getFirst, getAll, formatProductType, clip } from '../drug'
import { isCached, getCached } from '../cache'

const API = 'https://api.fda.gov/drug/label.json'

async function fetchDrug(slug, signal) {
  const name = decodeURIComponent(slug)

  if (isCached(name)) {
    const cached = getCached(name)
    if (cached.length) return { drug: cached[0], error: null }
  }

  const res = await fetch(
    `${API}?search=openfda.brand_name:"${encodeURIComponent(name)}"&limit=1`,
    { signal }
  )

  if (res.status === 404) return { drug: null, error: 'not_found' }
  if (!res.ok) return { drug: null, error: `HTTP ${res.status}` }

  const data = await res.json()
  const hit = data?.results?.[0]
  return hit ? { drug: hit, error: null } : { drug: null, error: 'not_found' }
}

function LabelRow({ label, value }) {
  if (!value) return null
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

function LabelSection({ title, content, style }) {
  if (!content) return null
  return (
    <div className="detail-section">
      <div className="section-title">{title}</div>
      <div className={style ? `section-text ${style}` : 'section-text'}>{content}</div>
    </div>
  )
}

function DrugDetail({ drug }) {
  const fda = drug.openfda || {}
  const brand = getFirst(fda.brand_name) || 'Unknown'
  const generic = getFirst(fda.generic_name)
  const ptype = formatProductType(fda.product_type)
  const routes = getAll(fda.route).map(r => r.toLowerCase()).join(', ')
  const mfr = getAll(fda.manufacturer_name).join('; ')
  const substances = getAll(fda.substance_name).join(', ')
  const pharmClass = getAll(fda.pharm_class_epc).join('; ')
  const appNum = getFirst(fda.application_number)
  const ndc = getAll(fda.product_ndc).slice(0, 3).join(', ')
  const splId = getFirst(fda.spl_id)

  // helper to grab first item from a root-level label field
  const field = (key) => clip(getFirst(drug[key]), 1200)

  return (
    <div>
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

      <div className="detail-meta">
        <LabelRow label="Generic name" value={generic} />
        <LabelRow label="Active substances" value={substances || null} />
        <LabelRow label="Pharmacological class" value={pharmClass || null} />
        <LabelRow label="Manufacturer" value={mfr || null} />
        <LabelRow label="Application #" value={appNum} />
        <LabelRow label="NDC" value={ndc || null} />
        <LabelRow label="SPL ID" value={splId} />
      </div>

      <div className="detail-sections">
        <LabelSection title="Indications & Usage" content={field('indications_and_usage')} />
        <LabelSection title="Dosage & Administration" content={field('dosage_and_administration')} />
        <LabelSection title="Description" content={field('description')} />
        <LabelSection title="Warnings" content={field('warnings')} style="warn" />
        <LabelSection title="Boxed Warning" content={field('boxed_warning')} style="warn" />
        <LabelSection title="Contraindications" content={field('contraindications')} style="warn" />
        <LabelSection title="Adverse Reactions" content={field('adverse_reactions')} style="danger" />
        <LabelSection title="Drug Interactions" content={field('drug_interactions')} style="warn" />
        <LabelSection title="Overdosage" content={field('overdosage')} style="danger" />
        <LabelSection title="How Supplied" content={field('how_supplied')} />
        <LabelSection title="Storage & Handling" content={field('storage_and_handling')} />
      </div>
    </div>
  )
}

export default function DetailPage() {
  const { brandSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const passedDrug = location.state?.drug ?? null
  const fromQuery = location.state?.fromQuery ?? null

  const [drug, setDrug] = useState(passedDrug)
  const [loading, setLoading] = useState(!passedDrug)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (passedDrug) return

    const ctrl = new AbortController()
    setLoading(true)

    fetchDrug(brandSlug, ctrl.signal).then(({ drug: d, error: e }) => {
      setDrug(d)
      setError(e)
      setLoading(false)
    })

    return () => ctrl.abort()
  }, [brandSlug, passedDrug])

  function goBack() {
    if (fromQuery) {
      navigate(`/?q=${encodeURIComponent(fromQuery)}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          MediSearch
        </span>
        <button className="back-btn" onClick={goBack}>
          ← {fromQuery ? `Results for "${fromQuery}"` : 'Back to search'}
        </button>
      </div>

      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="bc-link" onClick={() => navigate('/')}>Home</button>
          <span className="bc-sep">/</span>
          {fromQuery ? (
            <>
              <button type="button" className="bc-link" onClick={goBack}>
                Search: {fromQuery}
              </button>
              <span className="bc-sep">/</span>
            </>
          ) : (
            <>
              <button type="button" className="bc-link" onClick={() => navigate('/')}>
                Search
              </button>
              <span className="bc-sep">/</span>
            </>
          )}
          <span className="bc-current">
            {drug ? (getFirst((drug.openfda || {}).brand_name) || decodeURIComponent(brandSlug)) : decodeURIComponent(brandSlug)}
          </span>
        </nav>
        {loading && (
          <div className="state-box">
            <p style={{ color: '#888' }}>Loading…</p>
          </div>
        )}

        {!loading && error === 'not_found' && (
          <div className="state-box">
            <h3>Not found</h3>
            <p>
              Couldn't find a drug label for "{decodeURIComponent(brandSlug)}".
              The brand name might be spelled differently in the FDA database.
            </p>
            <button className="s-btn" onClick={goBack} style={{ marginTop: 8 }}>
              Go back
            </button>
          </div>
        )}

        {!loading && error && error !== 'not_found' && (
          <div className="state-box">
            <h3>Failed to load</h3>
            <p>Got an error: <em>{error}</em></p>
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
