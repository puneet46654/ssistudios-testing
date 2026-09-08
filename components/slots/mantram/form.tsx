'use client';
import React from 'react';
import { BookingFormData } from '@/app/slots/mantram/page';

interface BookingFormProps {
  formData: BookingFormData;
  selectedSlot: string;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function BookingForm({ formData, selectedSlot, isSubmitting, onChange, onSubmit, onBack }: BookingFormProps) {
  return (
    <form onSubmit={onSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-4xl mx-auto space-y-5 px-3 sm:px-6 font-sans">
      
      {/* Active Selection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-100 p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-1">Locked Target Slot</span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-base sm:text-lg font-black text-slate-900">{formData.bookingDate}</span>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-3 py-1 rounded-full">{selectedSlot}</span>
          </div>
        </div>
        <button 
          type="button" 
          onClick={onBack} 
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200/60 shadow-sm"
        >
          Change Slot
        </button>
      </div>

      {/* Main Details Box */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base sm:text-lg font-black text-slate-900">Practitioner & Institutional Details</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Please provide accurate verification information for your clinical slot record.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          
          {/* Doctor Name with Prefix */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Full Name & Title <span className="text-rose-500">*</span></label>
            <div className="flex gap-2">
              <select 
                name="salutation" 
                value={formData.salutation} 
                onChange={onChange} 
                className="w-24 sm:w-28 bg-slate-50/80 border border-slate-200 rounded-2xl px-3 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer shadow-sm"
              >
                <option value="Dr.">Dr.</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Prof.">Prof.</option>
              </select>
              <input 
                type="text" 
                name="doctorName" 
                required 
                placeholder="e.g. Ramesh Kumar"
                value={formData.doctorName} 
                onChange={onChange} 
                className="flex-1 bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
              />
            </div>
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Specialty / Department <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="specialty" 
              required 
              placeholder="e.g. Cardiology / Anaesthesiology"
              value={formData.specialty} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

          {/* Mobile Number with Country Code */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Mobile Number <span className="text-rose-500">*</span></label>
            <div className="flex gap-2">
              <select 
                name="countryCode" 
                value={formData.countryCode} 
                onChange={onChange} 
                className="w-28 sm:w-32 bg-slate-50/80 border border-slate-200 rounded-2xl px-2 sm:px-3 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer shadow-sm"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (UAE)</option>
              </select>
              <input 
                type="tel" 
                name="mobileNo" 
                required 
                placeholder="9876543210"
                value={formData.mobileNo} 
                onChange={onChange} 
                className="flex-1 bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Email Address <span className="text-rose-500">*</span></label>
            <input 
              type="email" 
              name="email" 
              required 
              placeholder="doctor@hospital.com"
              value={formData.email} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

          {/* Hospital Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Hospital Name <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="hospitalName" 
              required 
              placeholder="e.g. All India Institute of Medical Sciences"
              value={formData.hospitalName} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Country <span className="text-rose-500">*</span></label>
            <select 
              name="country" 
              required 
              value={formData.country} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer shadow-sm"
            >
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">State / Province <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="state" 
              required 
              placeholder="e.g. Haryana"
              value={formData.state} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

          {/* Place / City */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">City / Town <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="place" 
              required 
              placeholder="e.g. Gurugram"
              value={formData.place} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

          {/* Location / Landmark */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Specific Venue / Location <span className="text-rose-500">*</span></label>
            <input 
              type="text" 
              name="location" 
              required 
              placeholder="e.g. Main Auditorium Block B"
              value={formData.location} 
              onChange={onChange} 
              className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white shadow-sm" 
            />
          </div>

        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
        <button 
          type="button" 
          onClick={onBack} 
          className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full sm:w-auto sm:min-w-[220px] px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Securing Slot...
            </>
          ) : 'Confirm & Generate Ticket'}
        </button>
      </div>
    </form>
  );
}