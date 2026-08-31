import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deleteTrade, updateTrade } from '@/lib/googleSheets'

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

export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return NextResponse.json({ 
      trade: await updateTrade(id, schema.parse(await request.json())) 
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update trade' }, 
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteTrade(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete trade' }, 
      { status: 503 }
    )
  }
}