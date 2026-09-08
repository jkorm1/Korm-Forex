import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()
  
  
  const validPasswords = [
    process.env.AUTH_PASSWORD,
    'theandoheffect'
  ].filter(Boolean) 

  if (validPasswords.includes(password)) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('korm_forex_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    return response
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
