import { useState, useRef, useCallback, useEffect } from 'react'
import { isCached, getCached, setCached } from '../cache'

const API = 'https://api.fda.gov/drug/label.json'

export function useSearch() {
  const [inputVal, setInputVal] = useState('')
  const [lastQuery, setLastQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const abortRef = useRef(null)
  const timerRef = useRef(null)

  const doFetch = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort()

    if (isCached(q)) {
      const cached = getCached(q)
      setResults(cached)
      setLastQuery(q)
      setStatus(cached.length ? 'success' : 'empty')
      return
    }

    setStatus('loading')
    setResults([])
    setErrorMsg('')
    setLastQuery(q)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const url = `${API}?search=openfda.brand_name:"${encodeURIComponent(q)}"&limit=20`
      const res = await fetch(url, { signal: ctrl.signal })

      if (res.status === 404) {
        setCached(q, [])
        setStatus('empty')
        return
      }

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const body = await res.json()
          if (body?.error?.message) msg = body.error.message
        } catch (_) {}
        throw new Error(msg)
      }

      const data = await res.json()
      const hits = data?.results ?? []

      setCached(q, hits)
      setResults(hits)
      setStatus(hits.length ? 'success' : 'empty')
    } catch (err) {
      if (err.name === 'AbortError') return
      setErrorMsg(err.message || 'Request failed')
      setStatus('error')
    }
  }, [])

  // fires immediately — button click or quick link
  const search = useCallback((term) => {
    const q = (typeof term === 'string' ? term : inputVal).trim()
    if (!q) return
    clearTimeout(timerRef.current)
    setInputVal(q)
    doFetch(q)
  }, [inputVal, doFetch])

  // debounced — waits 450ms after typing stops
  const onInputChange = useCallback((val) => {
    setInputVal(val)
    clearTimeout(timerRef.current)
    const q = val.trim()
    if (!q) return
    timerRef.current = setTimeout(() => doFetch(q), 450)
  }, [doFetch])

  const clear = useCallback(() => {
    clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()
    setInputVal('')
    setLastQuery('')
    setResults([])
    setStatus('idle')
    setErrorMsg('')
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return { inputVal, setInputVal, lastQuery, results, status, errorMsg, search, onInputChange, clear }
}
