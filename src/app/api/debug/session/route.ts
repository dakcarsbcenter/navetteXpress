import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    console.log('🔍 [Debug Session] Récupération de la session...')
    
    const session = await getServerSession(authOptions)
    
    console.log('📋 [Debug Session] Session:', JSON.stringify(session, null, 2))
    
    return NextResponse.json({
      success: true,
      session: session,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasId: !!session?.user?.id,
      hasEmail: !!session?.user?.email,
      hasRole: !!session?.user?.role,
    })
  } catch (error) {
    console.error('❌ [Debug Session] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
