import { memo } from 'react'
import { getFirst, getAll, formatProductType, clip } from '../drug'

// memo so the card only re-renders if its drug prop actually changes
const DrugCard = memo(function DrugCard({ drug, onClick }) {
  const fda = drug.openfda || {}

  const brand      = getFirst(fda.brand_name)       || 'Unknown'
  const generic    = getFirst(fda.generic_name)
  const mfr        = getFirst(fda.manufacturer_name)
  const ptype      = formatProductType(fda.product_type)
  const routes     = getAll(fda.route)
  const substances = getAll(fda.substance_name)
  const pharmClass = getFirst(fda.pharm_class_epc)

  return (
    <div className="drug-card" onClick={onClick}>
      <div className="card-header">
        <div className="card-brand">{brand}</div>
        {ptype && (
          <span className={`card-type ${ptype === 'OTC' ? 'type-otc' : 'type-rx'}`}>
            {ptype}
          </span>
        )}
      </div>

      {generic && <div className="card-generic">{generic}</div>}

      {routes.length > 0 && (
        <div className="card-routes">
          {routes.map((r, i) => (
            <span key={i} className="route-tag">{r.toLowerCase()}</span>
          ))}
        </div>
      )}

      {substances.length > 0 && (
        <div className="card-substances">
          <span className="field-label">Active: </span>
          {substances.slice(0, 3).join(', ')}
          {substances.length > 3 && <span className="more-badge">+{substances.length - 3}</span>}
        </div>
      )}

      {pharmClass && (
        <div className="card-pharm">
          <span className="field-label">Class: </span>
          {clip(pharmClass, 70)}
        </div>
      )}

      <div className="card-footer">
        <span className="card-mfr" title={mfr || ''}>{mfr || '—'}</span>
        <span className="card-cta">Details →</span>
      </div>
    </div>
  )
})

export default DrugCard
