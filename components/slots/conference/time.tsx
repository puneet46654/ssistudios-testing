'use client';
import React, { useEffect, useMemo } from 'react';

interface TimeSelectionProps {
  availableSlots: string[];
  bookedSlots: string[];
  onSelectSlot: (slot: string) => void;
  bookingDate: string;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TimeSelection({ availableSlots, bookedSlots, onSelectSlot, bookingDate, onDateChange }: TimeSelectionProps) {
  
  // Auto-fetch today's date in YYYY-MM-DD format (timezone safe)
  const todayFormatted = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Ensure the parent component's state is strictly synced to today's date
  useEffect(() => {
    if (bookingDate !== todayFormatted) {
      // Create a synthetic event to satisfy the onDateChange signature
      const syntheticEvent = {
        target: { name: 'bookingDate', value: todayFormatted }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onDateChange(syntheticEvent);
    }
  }, [bookingDate, todayFormatted, onDateChange]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1 flex flex-col font-sans">
      
      {/* Header Card */}
      <div className="bg-white p-7 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center justify-center bg-purple-50 text-purple-600 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Phase 1 of 3
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-400">7-Min Sessions (3-Min Gap)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">Select Conference Session Slot</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Choose an available slot below to proceed with your delegate registration.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Status Legend Pill */}
          <div className="flex items-center gap-4 bg-slate-50/80 border border-slate-200/60 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></span> 
              Available
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-300/10"></span> 
              Occupied
            </div>
          </div>

          {/* Date Selector (Fixed & Read-Only) */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 px-1">Session Date</label>
            <input
              type="date"
              name="bookingDate"
              value={todayFormatted}
              readOnly
              className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-500 outline-none cursor-not-allowed shadow-sm select-none opacity-80"
              title="Date is fixed to today"
            />
          </div>
        </div>
      </div>

      {/* Slots Grid Box */}
      <div className="bg-white p-7 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3">
          {availableSlots.map((slot, idx) => {
            const isBooked = bookedSlots.includes(slot);
            return (
              <button
                key={idx}
                disabled={isBooked}
                onClick={() => !isBooked && onSelectSlot(slot)}
                className={`
                  group relative py-3.5 px-2.5 rounded-2xl text-xs font-bold text-center transition-all duration-300 flex flex-col items-center justify-center gap-1.5 select-none
                  ${isBooked 
                    ? 'bg-slate-50 border border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60' 
                    : 'bg-white border-2 border-slate-100 text-slate-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:shadow-xl hover:shadow-purple-600/15 hover:-translate-y-0.5 cursor-pointer'}
                `}
              >
                <span className="tracking-tight font-extrabold text-xs">{slot}</span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
                  isBooked 
                    ? 'bg-slate-200/60 text-slate-500' 
                    : 'bg-emerald-50 text-emerald-700 group-hover:bg-purple-700 group-hover:text-white'
                }`}>
                  {isBooked ? 'Reserved' : 'Open'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}