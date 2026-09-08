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

    const existingBooking = await MantramBooking.findOne({ bookingDate, slotTime });
    if (existingBooking) {
      return NextResponse.json({ success: false, error: 'Selected slot is already reserved.' }, { status: 400 });
    }

    const duplicateUser = await MantramBooking.findOne({ bookingDate, $or: [{ email }, { mobileNo }] });
    if (duplicateUser) {
      return NextResponse.json({ success: false, error: 'A booking with this email or mobile number already exists for this date.' }, { status: 400 });
    }

    const lastBooking = await MantramBooking.findOne().sort({ bookingNo: -1 });
    const nextBookingNo = lastBooking ? lastBooking.bookingNo + 1 : 1001;

    const newBooking = await MantramBooking.create({
      ...body,
      bookingNo: nextBookingNo,
    });

    return NextResponse.json({ success: true, bookingNo: newBooking.bookingNo }, { status: 201 });
  } catch (error) {
    console.error('Error creating mantram booking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}