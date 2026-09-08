import { NextResponse } from 'next/server'
import { z } from 'zod'
import { appendTrade, getTrades } from '@/lib/googleSheets'
import { isAuthenticated } from '@/lib/auth'

const schema = z.object({
  id: z.string(),
  date: z.string(),
  pair: z.enum(['XAU/USD', 'NAS100']),
  order: z.enum(['Buy', 'Sell']),
  sameDirection: z.boolean(),
  setupQuality: z.string(),
  entry: z.number(),
  outcome: z.enum(['Win', 'Loss', 'BE', 'Pending']),
  pl: z.number(),
  ratio: z.number(),
  checklist: z.array(z.boolean()).length(7)
})

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json({ trades: await getTrades() })
  } catch (error) {
    console.error('Google Sheets API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unable to read Google Sheet',
        details: 'Please check your Google Sheets credentials and permissions'
      }, 
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const trade = schema.parse(await request.json())
    return NextResponse.json({ trade: await appendTrade(trade) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid trade' }, 
      { status: 400 }
    )
  }
}