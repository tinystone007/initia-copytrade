import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Leaderboard } from './pages/Leaderboard'
import { Trade } from './pages/Trade'
import { Dashboard } from './pages/Dashboard'
import { TraderProfile } from './pages/TraderProfile'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trader/:address" element={<TraderProfile />} />
      </Route>
    </Routes>
  )
}
