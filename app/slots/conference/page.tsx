'use client';

import React, { useState, useEffect } from 'react';
import TimeSelection from '@/components/slots/conference/time';
import BookingForm from '@/components/slots/conference/form';
import GreetingTicket from '@/components/slots/conference/greeting';

export const CONFERENCE_BOOKING_DATES = ['2026-09-12', '2026-09-13'];

export interface ConferenceBookingFormData {
  bookingDate: string;
  country: string;
  state: string;
  place: string;
  location: string;
  salutation: string;
  delegateName: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  hospitalName: string;
  conferenceName: string;
  designation: string;
}

function generateConferenceSlots(): string[] {
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

export default function ConferenceBookingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingNo, setBookingNo] = useState<number | null>(null);

  const [formData, setFormData] = useState<ConferenceBookingFormData>({
    bookingDate: CONFERENCE_BOOKING_DATES[0],
    country: 'India',
    state: 'Telangana',
    place: 'Hyderabad',
    location: 'Main Convention Center',
    salutation: 'Dr.',
    delegateName: '',
    countryCode: '+91',
    mobileNo: '',
    email: '',
    hospitalName: '',
    conferenceName: 'Oncology For Post Graduates',
    designation: 'Delegate',
  });

  useEffect(() => {
    setAvailableSlots(generateConferenceSlots());
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const res = await fetch(`/api/conferences/booking?date=${formData.bookingDate}`);
        const data = await res.json();
        if (data.success) setBookedSlots(data.bookedSlots);
      } catch (err) {
        console.error("Failed to fetch conference slots", err);
      }
    };
    if (formData.bookingDate) fetchBookedSlots();
  }, [formData.bookingDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'bookingDate') {
      setSelectedSlot('');
      setStep(1);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSlotChoice = (slot: string) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/conference/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slotTime: selectedSlot }),
      });
      const result = await response.json();
      if (result.success) {
        setBookingNo(result.bookingNo);
        setStep(3);
      } else {
        alert(result.error);
        setStep(1);
      }
    } catch {
      alert('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 print:hidden">
        <div className="w-full px-4 sm:px-8 max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 font-extrabold text-lg">
              C
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                SSI Conference Portal
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Global Academic & Research Symposium
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500"></div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-8 max-w-7xl mx-auto py-8 flex flex-col justify-center">
        {step === 1 && (
          <TimeSelection 
            availableDates={CONFERENCE_BOOKING_DATES}
            availableSlots={availableSlots} 
            bookedSlots={bookedSlots}
            onSelectSlot={handleSlotChoice} 
            bookingDate={formData.bookingDate}
            onDateChange={handleChange}
          />
        )}
        {step === 2 && (
          <BookingForm 
            formData={formData}
            selectedSlot={selectedSlot}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <GreetingTicket 
            bookingNo={bookingNo ?? 1}
            formData={formData}
            selectedSlot={selectedSlot}
            onNewBooking={() => {
              setStep(1);
              setSelectedSlot('');
              setBookingNo(null);
            }}
          />
        )}
      </main>
    </div>
  );
}