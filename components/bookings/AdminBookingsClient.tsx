'use client'
import React from 'react'

type AnyObj = { [key: string]: any }

function downloadCSV(data: AnyObj[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  const keys = Object.keys(data[0])
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    // Escape double quotes
    return '"' + s.replace(/"/g, '""') + '"'
  }

  const rows = [keys.join(',')]
  for (const row of data) {
    rows.push(keys.map(k => escape(row[k])).join(','))
  }

  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function AdminBookingsClient({ conference, mantram }: { conference: AnyObj[]; mantram: AnyObj[] }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bookings Admin</h1>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Conference Bookings ({conference?.length ?? 0})</h2>
          <div className="flex gap-2">
            <button onClick={() => downloadCSV(conference, 'conference_bookings.csv')} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
          </div>
        </div>

        <div className="overflow-auto bg-white rounded shadow-sm border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Conference</th>
                <th className="px-3 py-2">Slot</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Hospital</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {conference && conference.map((c, idx) => (
                <tr key={c._id || idx} className="border-t">
                  <td className="px-3 py-2">{c.bookingNo ?? '-'}</td>
                  <td className="px-3 py-2">{c.salutation} {c.delegateName}</td>
                  <td className="px-3 py-2">{c.conferenceName}</td>
                  <td className="px-3 py-2">{c.slotTime}</td>
                  <td className="px-3 py-2">{c.countryCode} {c.mobileNo}<br/><span className="text-xs text-slate-500">{c.email}</span></td>
                  <td className="px-3 py-2">{c.hospitalName}</td>
                  <td className="px-3 py-2">{new Date(c.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Mantram Bookings ({mantram?.length ?? 0})</h2>
          <div className="flex gap-2">
            <button onClick={() => downloadCSV(mantram, 'mantram_bookings.csv')} className="px-3 py-2 bg-emerald-600 text-white rounded">Export CSV</button>
          </div>
        </div>

        <div className="overflow-auto bg-white rounded shadow-sm border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Doctor</th>
                <th className="px-3 py-2">Specialty</th>
                <th className="px-3 py-2">Slot</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Hospital</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {mantram && mantram.map((m, idx) => (
                <tr key={m._id || idx} className="border-t">
                  <td className="px-3 py-2">{m.bookingNo ?? '-'}</td>
                  <td className="px-3 py-2">{m.salutation} {m.doctorName}</td>
                  <td className="px-3 py-2">{m.specialty}</td>
                  <td className="px-3 py-2">{m.slotTime}</td>
                  <td className="px-3 py-2">{m.countryCode} {m.mobileNo}<br/><span className="text-xs text-slate-500">{m.email}</span></td>
                  <td className="px-3 py-2">{m.hospitalName}</td>
                  <td className="px-3 py-2">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
