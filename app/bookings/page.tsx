import dbConnect from '../../lib/dbconnect'
import ConferenceBooking from '../../models/ConferenceBooking'
import MantramBooking from '../../models/MantramBooking'
import AdminBookingsClient from '../../components/bookings/AdminBookingsClient'
import type { BookingLoadErrors, BookingRecord } from '../../components/bookings/AdminBookingsClient'

// This file is a Server Component. Do NOT add 'use client' here.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function Page() {
  // Keep your existing server-side administrator authorization check here,
  // or in the protected parent layout, before accessing booking records.
  let conference: BookingRecord[] = []
  let mantram: BookingRecord[] = []
  const loadErrors: BookingLoadErrors = {}

  try {
    await dbConnect()
    const [conferenceResult, mantramResult] = await Promise.allSettled([
      ConferenceBooking.find({}).sort({ createdAt: -1 }).lean().exec(),
      MantramBooking.find({}).sort({ createdAt: -1 }).lean().exec(),
    ])

    if (conferenceResult.status === 'fulfilled') {
      conference = JSON.parse(JSON.stringify(conferenceResult.value)) as BookingRecord[]
    } else {
      console.error('[Bookings] Conference query failed:', conferenceResult.reason)
      loadErrors.conference = 'Conference bookings could not be loaded. Please refresh the page.'
    }

    if (mantramResult.status === 'fulfilled') {
      mantram = JSON.parse(JSON.stringify(mantramResult.value)) as BookingRecord[]
    } else {
      console.error('[Bookings] Mantram query failed:', mantramResult.reason)
      loadErrors.mantram = 'Mantram bookings could not be loaded. Please refresh the page.'
    }
  } catch (error) {
    console.error('[Bookings] Loading failed:', error)
    loadErrors.conference = 'Bookings could not be loaded. Please refresh the page.'
    loadErrors.mantram = 'Bookings could not be loaded. Please refresh the page.'
  }

  return (
    <main className="min-h-screen w-full min-w-0 bg-slate-50 px-4 py-6 sm:px-6 lg:px-28">
      <AdminBookingsClient conference={conference} mantram={mantram} loadErrors={loadErrors} />
    </main>
  )
}
