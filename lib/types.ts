export type Pair = 'XAU/USD' | 'NAS100'
export type Order = 'Buy' | 'Sell'
export type Outcome = 'Win' | 'Loss' | 'BE' | 'Pending'

export interface Trade {
  id: string
  date: string
  pair: Pair
  order: Order
  sameDirection: boolean
  setupQuality: string
  entry: number
  outcome: Outcome
  pl: number
  ratio: number
  checklist: boolean[]
}
