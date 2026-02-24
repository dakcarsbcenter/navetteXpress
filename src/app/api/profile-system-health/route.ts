import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: '✅ Système d\'upload de photos de profil opérationnel',
      data: {
        userId: session.user.id,
        userRole: (session.user as any).role,
        currentImage: session.user.image,
        timestamp: new Date().toISOString(),
        features: {
          clientUpload: 'Disponible dans /client/dashboard',
          driverUpload: 'Disponible dans /driver/dashboard',
          adminManagement: 'Disponible dans /admin/dashboard'
        }
      }
    })

  } catch (error) {
    console.error('❌ [HEALTH-CHECK] Erreur:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur système'
    }, { status: 500 })
  }
}
