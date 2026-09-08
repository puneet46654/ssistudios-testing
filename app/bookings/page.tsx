import React from 'react'
import dbConnect from '@/lib/dbconnect'
import ConferenceBooking from '@/models/ConferenceBooking'
import MantramBooking from '@/models/MantramBooking'
import AdminBookingsClient from '@/components/bookings/AdminBookingsClient'

export default async function Page() {
	// Server-side: connect and fetch bookings
	await dbConnect()

	const conferences = await ConferenceBooking.find({}).sort({ createdAt: -1 }).lean().catch(() => [])
	const mantrams = await MantramBooking.find({}).sort({ createdAt: -1 }).lean().catch(() => [])

	// Ensure serializable
	const conf = JSON.parse(JSON.stringify(conferences || []))
	const mant = JSON.parse(JSON.stringify(mantrams || []))

	return (
		<main className="min-h-screen bg-slate-50">
			<div className="max-w-6xl mx-auto py-8">
				<AdminBookingsClient conference={conf} mantram={mant} />
			</div>
		</main>
	)
}
