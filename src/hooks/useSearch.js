import { useState, useRef, useCallback, useEffect } from 'react'
import { isCached, getCached, setCached } from '../cache'

const BASE = 'https://api.fda.gov/drug/label.json'
const DEBOUNCE_MS = 450

export function useSearch(initialQuery = '') {
  const [inputVal, setInputVal]     = useState(initialQuery)
  const [lastQuery, setLastQuery]   = useState(initialQuery)
  const [results,   setResults]     = useState([])
  const [status,    setStatus]      = useState(initialQuery ? 'loading' : 'idle')
  const [errorMsg,  setErrorMsg]    = useState('')

  const abortRef    = useRef(null)
  const timerRef    = useRef(null)
  // track which query we actually fired last so stale responses get dropped
  const activeQuery = useRef('')

  const doFetch = useCallback(async (q) => {
    // cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()

    // cache hit — no fetch needed
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

    const controller = new AbortController()
    abortRef.current = controller
    activeQuery.current = q

    try {
      const url = `${BASE}?search=openfda.brand_name:"${encodeURIComponent(q)}"&limit=20`
      const res  = await fetch(url, { signal: controller.signal })

      // stale response — a newer search was fired while this was in-flight
      if (activeQuery.current !== q) return

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
        } catch (_) { /* not json */ }
        throw new Error(msg)
      }

      const data = await res.json()
      const hits  = data?.results ?? []

      setCached(q, hits)
      setResults(hits)
      setStatus(hits.length ? 'success' : 'empty')
    } catch (err) {
      if (err.name === 'AbortError') return
      setErrorMsg(err.message || 'Request failed')
      setStatus('error')
    }
  }, [])

  // immediate search (button click, quick-link click)
  const search = useCallback((term) => {
    const q = (typeof term === 'string' ? term : inputVal).trim()
    if (!q) return
    clearTimeout(timerRef.current)
    setInputVal(q)
    doFetch(q)
  }, [inputVal, doFetch])

  // debounced search (fired on every keystroke, waits before hitting the API)
  const onInputChange = useCallback((val) => {
    setInputVal(val)
    clearTimeout(timerRef.current)
    const q = val.trim()
    if (!q) return
    activeQuery.current = q
    timerRef.current = setTimeout(() => doFetch(q), DEBOUNCE_MS)
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

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  return {
    inputVal, setInputVal,
    lastQuery,
    results,
    status,
    errorMsg,
    search,
    onInputChange,
    clear,
  }
}
