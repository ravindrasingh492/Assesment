// helper utils for working with FDA drug data
// openfda fields are always arrays and often missing — handle both cases

export function getFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null
}

export function getAll(arr) {
  return Array.isArray(arr) ? arr : []
}

// cuts long strings off with an ellipsis
export function clip(str, max = 200) {
  if (!str || typeof str !== 'string') return null
  const cleaned = str.replace(/\s+/g, ' ').trim()
  return cleaned.length > max ? cleaned.slice(0, max).trimEnd() + '…' : cleaned
}

// normalise "HUMAN OTC DRUG" / "HUMAN PRESCRIPTION DRUG" etc.
export function formatProductType(types) {
  const t = getFirst(types)
  if (!t) return null
  if (/otc/i.test(t))          return 'OTC'
  if (/prescription/i.test(t)) return 'Rx Only'
  return t
}

// used to build the detail page URL — prefer application_number, fall back to brand name
export function getDrugSlug(drug) {
  const brand = getFirst(drug?.openfda?.brand_name)
  if (brand) return encodeURIComponent(brand.toLowerCase())
  return 'unknown'
}
