  import { google } from 'googleapis'
  import type { Trade } from './types'

  export const headers = [
    'Date & Time',
    'Pair',
    'Order',
    'Largest Bar',
    'Space Left',
    'Engulfing',
    'HH',
    'LL',
    'BOS',
    'Same Direction (XAU / NAS)',
    'Setup Quality',
    'Entry',
    'Outcome',
    'P/L ($)',
    'Ratio (R:R)'
  ]

  const sheetName = process.env.GOOGLE_SHEET_TAB || 'Trade Log'

  function client() {
    const raw = process.env.GOOGLE_SHEETS_CREDENTIALS 
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    
    if (!raw || !spreadsheetId) {
      throw new Error('Add GOOGLE_SHEET_ID and GOOGLE_SHEETS_CREDENTIALS to .env.local.')
    }
    
    const credentials = JSON.parse(raw)
    const auth = new google.auth.JWT({
      email: credentials.client_email || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: credentials.private_key?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
    
    return { sheets: google.sheets({ version: 'v4', auth }), id: spreadsheetId }
  }

  function parse(row: string[], rowNumber: number): Trade {
    const checks = row.slice(3, 10).map(value => String(value).toUpperCase() === 'TRUE')
    const outcome = (row[12] || 'BE') as Trade['outcome']
    const amount = Number(String(row[13] || 0).replace(/[$,()]/g, '')) || 0
    
    return {
      id: String(rowNumber),
      date: row[0] || '',
      pair: (row[1] || 'XAU/USD') as Trade['pair'],
      order: (row[2] || 'Buy') as Trade['order'],
      sameDirection: checks[6],
      setupQuality: row[10] || `${checks.filter(Boolean).length}/7`,
      entry: Number(row[11] || 0),
      outcome,
      pl: outcome === 'Loss' ? -Math.abs(amount) : outcome === 'Win' ? Math.abs(amount) : amount,
      ratio: Number(String(row[14] || 0).replace(/^1:/, '')) || 0,
      checklist: checks
    }
  }

  function values(trade: Trade) {
    return [
      [
        trade.date,
        trade.pair,
        trade.order,
        ...trade.checklist.slice(0, 7),
        trade.setupQuality,
        trade.entry,
        trade.outcome,
        trade.pl,
        `1:${trade.ratio}`
      ]
    ]
  }

  export async function getTrades() {
    const { sheets, id } = client()
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: `${sheetName}!A:O`
    })
    
    return (response.data.values || [])
      .slice(1)
      .map((row, index) => parse(row, index + 2))
      .filter(trade => trade.date || trade.pair)
  }

export async function appendTrade(trade: Trade) {
  const { sheets, id } = client()
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `${sheetName}!A:O`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: values(trade) }
  })

  const updatedRange = response.data.updates?.updatedRange || ''
  const match = updatedRange.match(/![A-Z]+(\d+)/)
  const rowNumber = match?.[1]

  if (!rowNumber) {
    throw new Error('Could not determine the row Google Sheets assigned to this trade.')
  }

  return { ...trade, id: rowNumber }
}
  export async function updateTrade(rowNumber: string, trade: Trade) {
    const { sheets, id } = client()
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${sheetName}!A${rowNumber}:O${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: values(trade) }
    })
    return trade
  }

  export async function deleteTrade(rowNumber: string) {
    const { sheets, id } = client()
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: id,
      fields: 'sheets.properties'
    })
    
    const sheet = meta.data.sheets?.find(item => item.properties?.title === sheetName)
    const numericId = sheet?.properties?.sheetId
    
    if (numericId === undefined) {
      throw new Error(`Worksheet "${sheetName}" was not found.`)
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: numericId,
              dimension: 'ROWS',
              startIndex: Number(rowNumber) - 1,
              endIndex: Number(rowNumber)
            }
          }
        }]
      }
    })
  }

  export { sheetName }
