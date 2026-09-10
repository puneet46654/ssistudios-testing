import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import MantramBooking from '@/models/MantramBooking';

function generateMantramSlotTemplates(): string[] {
  const slots: string[] = [];
  const addTimeRangeSlots = (startHour: number, endHour: number) => {
    let current = new Date();
    current.setHours(startHour, 0, 0, 0);
    const end = new Date();
    end.setHours(endHour, 0, 0, 0);

    while (current < end) {
      const startTimeStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const slotEnd = new Date(current.getTime() + 5 * 60000);
      const endTimeStr = slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      slots.push(`${startTimeStr} - ${endTimeStr}`);
      current = new Date(current.getTime() + 7 * 60000);
    }
  };
  addTimeRangeSlots(9, 13);
  addTimeRangeSlots(14, 17);
  return slots;
}

function shouldPersistMantramSlot(slotTime: string) {
  const slots = generateMantramSlotTemplates();
  const index = slots.indexOf(slotTime);
  return index >= 0 && index >= 4;
}

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
    const { bookingDate, slotTime, email, mobileNo, persistToMongo } = body;

    if (!bookingDate || !slotTime) {
      return NextResponse.json({ success: false, error: 'Booking date and slot time are required' }, { status: 400 });
    }

    const shouldPersist = persistToMongo === true || (persistToMongo === undefined && shouldPersistMantramSlot(slotTime));

    if (shouldPersist) {
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

      return NextResponse.json({ success: true, bookingNo: newBooking.bookingNo, persisted: true }, { status: 201 });
    }

    return NextResponse.json({ success: true, bookingNo: Date.now() % 1000000, persisted: false }, { status: 201 });
  } catch (error) {
    console.error('Error creating mantram booking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
