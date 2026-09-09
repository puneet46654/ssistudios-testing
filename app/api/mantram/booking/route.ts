import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import MantramBooking from '@/models/MantramBooking';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date query parameter is required' }, { status: 400 });
    }

    const bookings = await MantramBooking.find({ bookingDate: date });
    const bookedSlots = bookings.map((b) => b.slotTime);

    return NextResponse.json({ success: true, bookedSlots });
  } catch (error) {
    console.error('Error fetching mantram slots:', error);
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

    // Temporary stop: MongoDB writes are disabled for now.
    // This keeps form submission working without saving the booking record.
    const demoBookingNo = Date.now() % 1000000;
    return NextResponse.json({ success: true, bookingNo: demoBookingNo }, { status: 201 });
  } catch (error) {
    console.error('Error creating mantram booking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}