import { cookies } from 'next/headers'

const AUTH_COOKIE_NAME = 'korm_forex_auth'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value
  
  
  const validPasswords = [
    process.env.AUTH_PASSWORD,
    'theandoheffect'
  ].filter(Boolean)
  
  return validPasswords.includes(authCookie || '')
}

export function createAuthCookie(password: string): boolean {
  const validPasswords = [
    process.env.AUTH_PASSWORD,
    'theandoheffect'
  ].filter(Boolean)
  
  return validPasswords.includes(password)
}
