'use client';
import React from 'react';
import { BookingFormData } from '@/app/slots/mantram/page';

interface GreetingTicketProps {
  bookingNo: number;
  formData: BookingFormData;
  selectedSlot: string;
  onNewBooking: () => void;
}

export default function GreetingTicket({ bookingNo, formData, selectedSlot, onNewBooking }: GreetingTicketProps) {
  
  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `SSI_Booking_Ticket_No_${bookingNo}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center animate-in zoom-in-95 duration-500 py-6">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-ticket, #pdf-ticket * { visibility: visible; }
          #pdf-ticket { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Cute, High-Density Compact Ticket Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-[0_12px_40px_rgb(0,0,0,0.08)] border-2 border-emerald-100 overflow-hidden flex flex-col">
        
        <div id="pdf-ticket" className="bg-white relative">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -mr-10 -mt-10 rounded-full blur-sm"></div>
             <div className="w-10 h-10 mx-auto mb-2 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-lg">✓</div>
             <h2 className="text-xl font-black tracking-tight font-sans">Booking Confirmed</h2>
             <p className="text-emerald-100 text-xs font-medium mt-0.5">SSI Official Session Pass</p>
          </div>

          {/* Ticket Information Body */}
          <div className="p-6 space-y-4">
             <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                <div>
                   <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Sequential No</p>
                   <p className="text-2xl font-black text-emerald-600">#{bookingNo}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Assigned Slot</p>
                   <p className="text-xs font-bold text-slate-900">{formData.bookingDate}</p>
                   <p className="text-sm font-black text-emerald-600">{selectedSlot}</p>
                </div>
             </div>

             <div className="space-y-3 px-1">
                <div>
                   <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Practitioner Details</p>
                   <p className="text-sm font-bold text-slate-900 mt-0.5">
                     {formData.salutation} {formData.doctorName} 
                     <span className="text-xs font-semibold text-slate-500 ml-1.5">({formData.specialty})</span>
                   </p>
                </div>

                <div>
                   <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Hospital & Contact</p>
                   <p className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{formData.hospitalName}</p>
                   <p className="text-xs font-medium text-slate-600 mt-0.5">{formData.countryCode} {formData.mobileNo} • {formData.email}</p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-2xl">
                   <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider mb-0.5">Venue Location</p>
                   <p className="text-xs font-semibold text-slate-700 leading-relaxed">{formData.location}, {formData.place}, {formData.state}, {formData.country}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 no-print">
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
          <button 
            onClick={onNewBooking}
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Book Another
          </button>
        </div>

      </div>
    </div>
  );
}