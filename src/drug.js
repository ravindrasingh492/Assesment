// openfda fields are arrays and sometimes missing entirely
export function getFirst(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null
}

export function getAll(arr) {
  return Array.isArray(arr) ? arr : []
}

export function clip(str, max = 200) {
  if (!str) return null
  const s = str.replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

// "HUMAN OTC DRUG" -> "OTC", "HUMAN PRESCRIPTION DRUG" -> "Rx Only"
export function formatProductType(types) {
  const t = getFirst(types)
  if (!t) return null
  if (/otc/i.test(t)) return 'OTC'
  if (/prescription/i.test(t)) return 'Rx Only'
  return t
}

export function getDrugSlug(drug) {
  const brand = getFirst(drug?.openfda?.brand_name)
  if (brand) return encodeURIComponent(brand.toLowerCase())
  return 'unknown'
}
