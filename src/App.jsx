import { Routes, Route } from 'react-router-dom'
import SearchPage from './pages/SearchPage'
import DetailPage from './pages/DetailPage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/"              element={<SearchPage />} />
      <Route path="/drug/:brandSlug" element={<DetailPage />} />
    </Routes>
  )
}
