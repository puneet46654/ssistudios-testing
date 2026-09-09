import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import ConferenceBooking from '@/models/ConferenceBooking';

const ALLOWED_CONFERENCE_BOOKING_DATES = ['2026-09-12', '2026-09-13'];

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date query parameter is required' }, { status: 400 });
    }

    if (!ALLOWED_CONFERENCE_BOOKING_DATES.includes(date)) {
      return NextResponse.json({ success: false, error: 'Invalid session date selected.' }, { status: 400 });
    }

    const bookings = await ConferenceBooking.find({ bookingDate: date });
    const bookedSlots = bookings.map((b) => b.slotTime);

    return NextResponse.json({ success: true, bookedSlots });
  } catch (error) {
    console.error('Error fetching conference slots:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { bookingDate, slotTime, email, mobileNo } = body;

    if (!bookingDate || !slotTime) {
      return NextResponse.json({ success: false, error: 'Booking date and slot time are required' }, { status: 400 });
    }

    if (!ALLOWED_CONFERENCE_BOOKING_DATES.includes(bookingDate)) {
      return NextResponse.json({ success: false, error: 'Invalid session date selected.' }, { status: 400 });
    }

    // Temporary stop: MongoDB writes are disabled for now.
    // This keeps form submission working without saving the booking record.
    const demoBookingNo = Date.now() % 1000000;
    return NextResponse.json({ success: true, bookingNo: demoBookingNo }, { status: 201 });
  } catch (error) {
    console.error('Error creating conference booking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}