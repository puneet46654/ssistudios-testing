import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import ConferenceBooking from '@/models/ConferenceBooking';

const ALLOWED_CONFERENCE_BOOKING_DATES = ['2026-09-12', '2026-09-13'];

function generateConferenceSlotTemplates(): string[] {
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
  addTimeRangeSlots(9, 17);
  return slots;
}

function shouldPersistConferenceSlot(slotTime: string) {
  const slots = generateConferenceSlotTemplates();
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
    const { bookingDate, slotTime, email, mobileNo, persistToMongo } = body;

    if (!bookingDate || !slotTime) {
      return NextResponse.json({ success: false, error: 'Booking date and slot time are required' }, { status: 400 });
    }

    if (!ALLOWED_CONFERENCE_BOOKING_DATES.includes(bookingDate)) {
      return NextResponse.json({ success: false, error: 'Invalid session date selected.' }, { status: 400 });
    }

    const shouldPersist = persistToMongo === true || (persistToMongo === undefined && shouldPersistConferenceSlot(slotTime));

    if (shouldPersist) {
      const existingBooking = await ConferenceBooking.findOne({ bookingDate, slotTime });
      if (existingBooking) {
        return NextResponse.json({ success: false, error: 'Selected slot is already reserved.' }, { status: 400 });
      }

      const duplicateUser = await ConferenceBooking.findOne({ bookingDate, $or: [{ email }, { mobileNo }] });
      if (duplicateUser) {
        return NextResponse.json({ success: false, error: 'A registration with this email or mobile number already exists for this date.' }, { status: 400 });
      }

      const lastBooking = await ConferenceBooking.findOne().sort({ bookingNo: -1 });
      const nextBookingNo = lastBooking ? lastBooking.bookingNo + 1 : 2001;

      const newBooking = await ConferenceBooking.create({
        ...body,
        bookingNo: nextBookingNo,
      });

      return NextResponse.json({ success: true, bookingNo: newBooking.bookingNo, persisted: true }, { status: 201 });
    }

    return NextResponse.json({ success: true, bookingNo: Date.now() % 1000000, persisted: false }, { status: 201 });
  } catch (error) {
    console.error('Error creating conference booking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}