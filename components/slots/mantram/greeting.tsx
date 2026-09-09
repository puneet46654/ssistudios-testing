'use client';
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { BookingFormData } from '@/app/slots/mantram/page';

interface GreetingTicketProps {
  bookingNo: number;
  formData: BookingFormData;
  selectedSlot: string;
  onNewBooking: () => void;
}

export default function GreetingTicket({ bookingNo, formData, selectedSlot, onNewBooking }: GreetingTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownloadImage = async () => {
    if (!ticketRef.current) return;
    
    try {
      setIsDownloading(true);
      
      // Convert the specific div to a high-res PNG
      const dataUrl = await toPng(ticketRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Multiplies resolution for a super crisp image
        backgroundColor: '#ffffff'
      });
      // Detect iOS devices (iPhone / iPad / iPod and iPadOS)
      const isIOS = typeof navigator !== 'undefined' && (
        /iP(hone|od|ad)/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1)
      );

      // On iOS Safari the `download` attribute is ignored — open the image in a new tab so
      // users can long-press to save. For other browsers create a blob and trigger download.
      if (isIOS) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`<!doctype html><title>Ticket</title><style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#fff}</style><img src="${dataUrl}" style="max-width:100%;height:auto;"/>`);
          newWindow.document.close();
        } else {
          window.location.href = dataUrl;
        }
      } else {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `SSI_Booking_Ticket_No_${bookingNo}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      
    } catch (err) {
      console.error('Error generating ticket image:', err);
      alert('Failed to download the ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center animate-in zoom-in-95 duration-500 py-6">
      
      {/* Cute, High-Density Compact Ticket Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-[0_12px_40px_rgb(0,0,0,0.08)] border-2 border-emerald-100 overflow-hidden flex flex-col">
        
        {/* We attach the React Ref here. Everything inside this div becomes the image */}
        <div ref={ticketRef} className="bg-white relative">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -mr-10 -mt-10 rounded-full blur-sm"></div>
             <div className="w-10 h-10 mx-auto mb-2 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-lg">✓</div>
             <h2 className="text-xl font-black tracking-tight font-sans">Booking Confirmed</h2>
             <p className="text-emerald-100 text-xs font-medium mt-0.5">Please Download The Ticket For Entry</p>
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

        {/* Action Controls (These are outside the ref, so they won't be in the downloaded image) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Ticket
              </>
            )}
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