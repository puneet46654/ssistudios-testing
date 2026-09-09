'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import TimeSelection from '@/components/slots/mantram/time';
import BookingForm from '@/components/slots/mantram/form';
import GreetingTicket from '@/components/slots/mantram/greeting';

export interface BookingFormData {
  bookingDate: string;
  country: string;
  state: string;
  place: string;
  location: string;
  salutation: string;
  doctorName: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  hospitalName: string;
  specialty: string;
}

function isPersistedMantramSlot(slot: string, slots: string[]) {
  const index = slots.indexOf(slot);
  return index >= 0 && index >= 4;
}

function generateMantramSlots(): string[] {
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

export default function MantramBookingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [bookingNo, setBookingNo] = useState<number | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    bookingDate: new Date().toISOString().split('T')[0],
    country: 'India',
    state: 'Haryana',
    place: 'Gurugram',
    location: '',
    salutation: 'Dr.',
    doctorName: '',
    countryCode: '+91',
    mobileNo: '',
    email: '',
    hospitalName: '',
    specialty: 'Anaesthesiology',
  });

  useEffect(() => {
    setAvailableSlots(generateMantramSlots());
  }, []);

  useEffect(() => {
    const fetchBookedSlots = async () => {
      try {
        const res = await fetch(`/api/mantram/booking?date=${formData.bookingDate}`);
        const data = await res.json();
        if (data.success) setBookedSlots(data.bookedSlots);
      } catch (err) {
        console.error("Failed to fetch slots", err);
      }
    };
    if (formData.bookingDate) fetchBookedSlots();
  }, [formData.bookingDate, step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSlotChoice = (slot: string) => {
    setSelectedSlot(slot);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(2);
      setIsTransitioning(false);
    }, 7000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const shouldPersist = isPersistedMantramSlot(selectedSlot, availableSlots);
      const response = await fetch('/api/mantram/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slotTime: selectedSlot, persistToMongo: shouldPersist }),
      });
      const result = await response.json();
      if (result.success) {
        if (!result.persisted) {
          setBookedSlots((prev) => (prev.includes(selectedSlot) ? prev : [...prev, selectedSlot]));
        }
        setBookingNo(result.bookingNo);
        setTimeout(() => {
          setStep(3);
          setIsSubmitting(false);
        }, 7000);
        return;
      } else {
        alert(result.error);
        setStep(1);
      }
    } catch {
      alert('Error connecting to server. Please try again.');
    } finally {
      if (step !== 3) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 print:hidden">
        <div className="w-full px-4 sm:px-8 max-w-7xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 font-extrabold text-lg">
              S
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                SSI Mantram Portal
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Advanced Clinical Session Scheduling
              </p>
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-8 max-w-7xl mx-auto py-8 flex flex-col justify-center">
        {step === 1 && (
          <TimeSelection 
            availableSlots={availableSlots} 
            bookedSlots={bookedSlots}
            onSelectSlot={handleSlotChoice} 
            bookingDate={formData.bookingDate}
            onDateChange={handleChange}
          />
        )}
        {isTransitioning && (
          <div className="sr-only" aria-live="polite">
            Preparing your mantram booking.
          </div>
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