import { NextRequest, NextResponse } from 'next/server'
import { checkDriverAvailability } from '@/lib/driver-availability'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const driverId = searchParams.get('driverId')
    const scheduledDateTime = searchParams.get('scheduledDateTime')

    if (!driverId || !scheduledDateTime) {
      return NextResponse.json({
        success: false,
        error: 'driverId et scheduledDateTime sont requis'
      }, { status: 400 })
    }

    const result = await checkDriverAvailability(driverId, new Date(scheduledDateTime))

    return NextResponse.json({
      success: true,
      available: result.available,
      message: result.message
    })

  } catch (error: any) {
    console.error('❌ Erreur vérification disponibilité:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la vérification'
    }, { status: 500 })
  }
}
