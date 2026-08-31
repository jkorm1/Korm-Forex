import type { Trade } from './types'

export function calculateAnalytics(trades: Trade[]) {
  const closed = trades.filter(t => t.outcome !== 'Pending')
  const pending = trades.filter(t => t.outcome === 'Pending')

  const sorted = [...closed].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const totalPL = sorted.reduce((s, t) => s + t.pl, 0)
  const wins = sorted.filter(t => t.outcome === 'Win').length
  const losses = sorted.filter(t => t.outcome === 'Loss').length
  const breakeven = sorted.filter(t => t.outcome === 'BE').length

  const complete = sorted.filter(t => t.checklist.every(Boolean))
  const incomplete = sorted.filter(t => !t.checklist.every(Boolean))

  let running = 0
  const equityCurve = sorted.map(t => {
    running += t.pl
    return { date: formatShortDate(t.date), value: running }
  })

  const pairs = Array.from(new Set(sorted.map(t => t.pair)))
  const byPair = pairs.map(name => ({
    name,
    value: sorted.filter(t => t.pair === name).reduce((s, t) => s + t.pl, 0)
  }))

  const topPair = byPair.length
    ? byPair.reduce((best, p) => (p.value > best.value ? p : best), byPair[0])
    : undefined

  // current streak (consecutive wins ending at the most recent closed trade)
  let streak = 0
  for (let i = sorted.length - 1; i >= 0 && sorted[i].outcome === 'Win'; i--) {
    streak++
  }

  // best win streak across the whole period
  let bestStreak = 0
  let run = 0
  for (const t of sorted) {
    if (t.outcome === 'Win') {
      run++
      bestStreak = Math.max(bestStreak, run)
    } else {
      run = 0
    }
  }

  return {
    totalPL,
    totalTrades: sorted.length,
    pendingCount: pending.length,
    wins,
    losses,
    breakeven,
    winRate: sorted.length ? (wins / sorted.length) * 100 : 0,
    streak,
    bestStreak,
    equityCurve,
    byPair,
    topPair,
    instrumentCount: pairs.length,
    qualityWinRate: complete.length
      ? (complete.filter(t => t.outcome === 'Win').length / complete.length) * 100
      : 0,
    incompleteWinRate: incomplete.length
      ? (incomplete.filter(t => t.outcome === 'Win').length / incomplete.length) * 100
      : 0
  }
}

function formatShortDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function withinDays(dateValue: string, days: number, from = new Date()) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false
  const diffDays = (from.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= days
}