'use client'

/** Single-file replacement. Requires your existing Tailwind and lucide-react setup.
 * API: GET/POST /api/admin/bookings/:type; PATCH/DELETE /api/admin/bookings/:type/:id.
 * GET returns an array; POST/PATCH return the complete saved booking with _id or id.
 * The backend must enforce admin authorization, validation and slot rules.
 * Override the optional api prop in a client wrapper to use your existing endpoints.
 * Initial props seed client state. Use Refresh for subsequent reads.
 */

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Mail,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react'

export type BookingRecord = Record<string, unknown>
export type BookingType = 'conference' | 'mantram'
export type BookingLoadErrors = Partial<Record<BookingType, string>>

type Props = {
  conference: BookingRecord[]
  mantram: BookingRecord[]
  loadErrors?: BookingLoadErrors
  api?: BookingApi
}

type SortKey =
  | 'bookingNo'
  | 'name'
  | 'detail'
  | 'slot'
  | 'hospital'
  | 'createdAt'

type SortDirection = 'asc' | 'desc'

type SortConfig = {
  key: SortKey
  direction: SortDirection
}

type TableRow = {
  key: string
  original: BookingRecord
  bookingNo: string
  name: string
  detail: string
  slot: string
  phone: string
  email: string
  hospital: string
  timestamp: number | null
  date: string
  time: string
  isoDate: string
  searchText: string
}

type MobileSortOption = {
  value: string
  label: string
  key: SortKey
  direction: SortDirection
}

const EMPTY_ROWS: BookingRecord[] = []
const TIME_ZONE = 'Asia/Kolkata'

const DATE_FORMAT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
})

const TIME_FORMAT = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: TIME_ZONE,
})

const COLLATOR = new Intl.Collator('en-IN', {
  numeric: true,
  sensitivity: 'base',
})

const HOSPITAL_STYLES = [
  'border-indigo-100 bg-indigo-50 text-indigo-700',
  'border-sky-100 bg-sky-50 text-sky-700',
  'border-emerald-100 bg-emerald-50 text-emerald-700',
  'border-amber-100 bg-amber-50 text-amber-700',
  'border-violet-100 bg-violet-50 text-violet-700',
  'border-rose-100 bg-rose-50 text-rose-700',
]

const MOBILE_SORT_OPTIONS: MobileSortOption[] = [
  {
    value: 'createdAt-desc',
    label: 'Newest first',
    key: 'createdAt',
    direction: 'desc',
  },
  {
    value: 'createdAt-asc',
    label: 'Oldest first',
    key: 'createdAt',
    direction: 'asc',
  },
  {
    value: 'name-asc',
    label: 'Name: A to Z',
    key: 'name',
    direction: 'asc',
  },
  {
    value: 'name-desc',
    label: 'Name: Z to A',
    key: 'name',
    direction: 'desc',
  },
  {
    value: 'bookingNo-asc',
    label: 'Booking no.: ascending',
    key: 'bookingNo',
    direction: 'asc',
  },
  {
    value: 'bookingNo-desc',
    label: 'Booking no.: descending',
    key: 'bookingNo',
    direction: 'desc',
  },
  {
    value: 'hospital-asc',
    label: 'Hospital: A to Z',
    key: 'hospital',
    direction: 'asc',
  },
]

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function getDate(value: unknown): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return null
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function toTableRow(
  row: BookingRecord,
  type: BookingType,
  index: number
): TableRow {
  const rawName = text(
    type === 'conference'
      ? row.delegateName
      : row.doctorName
  )

  const mobile = text(row.mobileNo)
  const date = getDate(row.createdAt)

  const fields = {
    bookingNo: text(row.bookingNo),

    name: rawName
      ? [
          text(row.salutation),
          rawName,
        ]
          .filter(Boolean)
          .join(' ')
      : '',

    detail: text(
      type === 'conference'
        ? row.conferenceName
        : row.specialty
    ),

    slot: text(row.slotTime),

    phone: mobile
      ? [
          text(row.countryCode),
          mobile,
        ]
          .filter(Boolean)
          .join(' ')
      : '',

    email: text(row.email),

    hospital: text(row.hospitalName),
  }

  const displayDate = date
    ? DATE_FORMAT.format(date)
    : text(row.createdAt)

  const displayTime = date
    ? TIME_FORMAT.format(date)
    : ''

  return {
    key: `${type}-${text(row._id) || 'row'}-${index}`,

    original: row,

    ...fields,

    timestamp: date
      ? date.getTime()
      : null,

    date: displayDate,

    time: displayTime,

    isoDate: date
      ? date.toISOString()
      : '',

    searchText: normalize(
      [
        ...Object.values(fields),
        mobile.replace(/\D/g, ''),
        fields.phone.replace(/\D/g, ''),
        displayDate,
        displayTime,
        text(row.createdAt),
      ].join(' ')
    ),
  }
}

function compareRows(
  a: TableRow,
  b: TableRow,
  config: SortConfig
): number {
  if (config.key === 'createdAt') {
    if (a.timestamp === null) {
      return b.timestamp === null
        ? 0
        : 1
    }

    if (b.timestamp === null) {
      return -1
    }

    return config.direction === 'desc'
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp
  }

  const getValue = (row: TableRow) => {
    switch (config.key) {
      case 'bookingNo':
        return row.bookingNo

      case 'name':
        return row.name

      case 'detail':
        return row.detail

      case 'slot':
        return row.slot

      case 'hospital':
        return row.hospital

      default:
        return ''
    }
  }

  const valueA = getValue(a)
  const valueB = getValue(b)

  if (!valueA) {
    return valueB
      ? 1
      : 0
  }

  if (!valueB) {
    return -1
  }

  const comparison = COLLATOR.compare(
    valueA,
    valueB
  )

  return config.direction === 'desc'
    ? -comparison
    : comparison
}

function csvCell(value: unknown): string {
  let result = ''

  if (
    value !== null &&
    value !== undefined
  ) {
    result =
      typeof value === 'object'
        ? JSON.stringify(value) ?? ''
        : String(value)
  }

  if (
    typeof value === 'string' &&
    /^(?:\s*[=+@-]|[\t\r\n])/.test(result)
  ) {
    result = `'${result}`
  }

  return `"${result.replace(/"/g, '""')}"`
}

function downloadCSV(
  rows: BookingRecord[],
  filename: string
): void {
  if (!rows.length) {
    return
  }

  const keys = Array.from(
    new Set(
      rows.flatMap((row) =>
        Object.keys(row)
      )
    )
  )

  const lines = [
    keys
      .map(csvCell)
      .join(','),

    ...rows.map((row) =>
      keys
        .map((key) =>
          csvCell(row[key])
        )
        .join(',')
    ),
  ]

  const blob = new Blob(
    [
      '\uFEFF',
      lines.join('\r\n'),
    ],
    {
      type: 'text/csv;charset=utf-8;',
    }
  )

  const url =
    URL.createObjectURL(blob)

  const anchor =
    document.createElement('a')

  try {
    anchor.href = url
    anchor.download = filename

    document.body.appendChild(anchor)

    anchor.click()
  } finally {
    anchor.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }
}

function hospitalStyle(
  value: string
): string {
  if (!value) {
    return 'border-slate-200 bg-slate-50 text-slate-600'
  }

  let hash = 0

  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(i)) |
      0
  }

  return HOSPITAL_STYLES[
    Math.abs(hash) %
      HOSPITAL_STYLES.length
  ]
}

function InfoField({
  label,
  children,
  fullWidth = false,
}: {
  label: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div
      className={
        fullWidth
          ? 'sm:col-span-2'
          : ''
      }
    >
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      {children}
    </div>
  )
}

function MobileBookingCard({
  row,
  isConference,
}: {
  row: TableRow
  isConference: boolean
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Booking No.
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />

            <span className="break-all font-mono text-sm font-bold text-slate-700">
              {row.bookingNo || '-'}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium text-slate-600">
            {row.date || '-'}
          </p>

          {row.time && (
            <p className="mt-0.5 text-[10px] text-slate-400">
              {row.time}
            </p>
          )}
        </div>
      </div>

      {/* Person */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              {isConference
                ? 'Delegate'
                : 'Doctor'}
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-900">
              {row.name || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 p-4 sm:grid-cols-2">
        <InfoField
          label={
            isConference
              ? 'Conference'
              : 'Specialty'
          }
        >
          <p className="break-words text-sm font-medium leading-5 text-slate-700">
            {row.detail || '-'}
          </p>
        </InfoField>

        <InfoField label="Slot">
          <div className="flex items-start gap-2 text-sm font-medium text-slate-700">
            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <span className="break-words">
              {row.slot || '-'}
            </span>
          </div>
        </InfoField>

        <InfoField label="Mobile">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <span className="break-all tabular-nums">
              {row.phone || '-'}
            </span>
          </div>
        </InfoField>

        <InfoField label="Email">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

            <span className="break-all">
              {row.email || '-'}
            </span>
          </div>
        </InfoField>

        <InfoField
          label="Hospital"
          fullWidth
        >
          {row.hospital ? (
            <span
              className={`inline-flex max-w-full items-start gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-4 shadow-sm ${hospitalStyle(
                row.hospital
              )}`}
            >
              <Building2 className="mt-0.5 h-3 w-3 shrink-0" />

              <span className="break-words">
                {row.hospital}
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-500">
              -
            </span>
          )}
        </InfoField>
      </div>
    </article>
  )
}

export type BookingInput = {
  salutation: string
  delegateName?: string
  doctorName?: string
  conferenceName?: string
  specialty?: string
  slotTime: string
  countryCode: string
  mobileNo: string
  email: string
  hospitalName: string
}
export type BookingApi = {
  list(type: BookingType): Promise<BookingRecord[]>
  create(type: BookingType, input: BookingInput, requestKey: string): Promise<BookingRecord>
  update(type: BookingType, id: string, input: BookingInput, version?: unknown): Promise<BookingRecord>
  remove(type: BookingType, id: string, version?: unknown): Promise<void>
}


export function recordId(record: BookingRecord): string {
  return text(record._id) || text(record.id)
}
export function person(record: BookingRecord, type: BookingType): string {
  return [text(record.salutation), text(record[type === 'conference' ? 'delegateName' : 'doctorName'])].filter(Boolean).join(' ')
}
export function detail(record: BookingRecord, type: BookingType): string {
  return text(record[type === 'conference' ? 'conferenceName' : 'specialty'])
}

export function createdTime(record: BookingRecord): number | null {
  const value = record.createdAt
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}
export function createdLabel(record: BookingRecord): string {
  const time = createdTime(record)
  return time === null ? text(record.createdAt) || '—' : new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
  }).format(time)
}
export function initialInput(type: BookingType, record: BookingRecord = {}): BookingInput {
  return {
    salutation: text(record.salutation),
    ...(type === 'conference'
      ? { delegateName: text(record.delegateName), conferenceName: text(record.conferenceName) }
      : { doctorName: text(record.doctorName), specialty: text(record.specialty) }),
    slotTime: text(record.slotTime), countryCode: text(record.countryCode) || '+91',
    mobileNo: text(record.mobileNo), email: text(record.email), hospitalName: text(record.hospitalName),
  }
}
export function validateInput(input: BookingInput, type: BookingType): Partial<Record<keyof BookingInput, string>> {
  const errors: Partial<Record<keyof BookingInput, string>> = {}
  const name = type === 'conference' ? 'delegateName' : 'doctorName'
  const subject = type === 'conference' ? 'conferenceName' : 'specialty'
  for (const key of [name, subject, 'slotTime', 'hospitalName'] as const) {
    if (!text(input[key])) errors[key] = 'This field is required.'
  }
  for (const [key, value] of Object.entries(input)) {
    if (value.length > 200) errors[key as keyof BookingInput] = 'Use 200 characters or fewer.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = 'Enter a valid email address.'
  if (!/^\+\d{1,3}$/.test(input.countryCode)) errors.countryCode = 'Use a country code such as +91.'
  if (!/^[\d ()-]+$/.test(input.mobileNo) || input.mobileNo.replace(/\D/g, '').length < 6 ||
      (input.countryCode + input.mobileNo).replace(/\D/g, '').length > 15) errors.mobileNo = 'Enter a valid phone number.'
  return errors
}

function isRecord(value: unknown): value is BookingRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
function savedRecord(value: unknown): BookingRecord {
  if (!isRecord(value) || !recordId(value)) throw new Error('The server must return the saved booking with a stable id.')
  return value
}

/** Same-origin API adapter. Supply csrfToken when your session authentication requires it. */
export function createBookingApi(base = '/api/admin/bookings', csrfToken?: string): BookingApi {
  const root = base.replace(/\/$/, '')
  async function request(path: string, method = 'GET', body?: unknown, requestKey?: string): Promise<unknown> {
    const response = await fetch(root + path, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...(requestKey ? { 'Idempotency-Key': requestKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const message = isRecord(payload) ? text(payload.message) : ''
      throw new Error(message || (response.status === 409 ? 'This booking changed or the slot is unavailable. Refresh and try again.' : response.status === 401 || response.status === 403 ? 'Your session does not have permission for this action.' : `Request failed (${response.status}). Please try again.`))
    }
    return payload
  }
  return {
    async list(type) {
      const data = await request(`/${type}`)
      if (!Array.isArray(data) || !data.every(isRecord)) throw new Error('The server returned an invalid booking list.')
      return data
    },
    async create(type, input, key) { return savedRecord(await request(`/${type}`, 'POST', input, key)) },
    async update(type, id, input, version) {
      return savedRecord(await request(`/${type}/${encodeURIComponent(id)}`, 'PATCH', { ...input, version }))
    },
    async remove(type, id, version) { await request(`/${type}/${encodeURIComponent(id)}`, 'DELETE', { version }) },
  }
}

export function csvFor(records: BookingRecord[], type: BookingType): string {
  const cell = (value: string) => `"${(/^(?:\s*[=+@-]|[\t\r\n])/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`
  const rows = records.map(record => [text(record.bookingNo), person(record, type), detail(record, type),
    text(record.slotTime), text(record.countryCode), text(record.mobileNo), text(record.email), text(record.hospitalName), createdLabel(record)])
  return '\uFEFF' + [['Booking no.', type === 'conference' ? 'Delegate' : 'Doctor', type === 'conference' ? 'Conference' : 'Specialty',
    'Slot', 'Country code', 'Mobile', 'Email', 'Hospital', 'Created (Asia/Kolkata)'], ...rows].map(row => row.map(cell).join(',')).join('\r\n')
}



type CrudState = { mode: 'create' | 'view' | 'edit' | 'delete'; type: BookingType; record?: BookingRecord }
const DEFAULT_API = createBookingApi()
const CRUD_BUTTON = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40'
const CRUD_PRIMARY = CRUD_BUTTON + ' !border-indigo-600 !bg-indigo-600 !text-white hover:!bg-indigo-700'

function BookingCrudDialog({ state, api, onClose, onSaved, onDeleted }: {
  state: CrudState; api: BookingApi; onClose: () => void
  onSaved: (type: BookingType, record: BookingRecord, previousId?: string) => void
  onDeleted: (type: BookingType, id: string) => void
}) {
  const uid = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const locked = useRef(false)
  const requestKey = useRef('')
  const [mode, setMode] = useState(state.mode)
  const [form, setForm] = useState<BookingInput>(() => initialInput(state.type, state.record))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof BookingInput, string>>>({})
  const conference = state.type === 'conference'
  const fields: { key: keyof BookingInput; label: string; required?: boolean; type?: string }[] = [
    { key: 'salutation', label: 'Salutation' },
    { key: conference ? 'delegateName' : 'doctorName', label: conference ? 'Delegate name' : 'Doctor name', required: true },
    { key: conference ? 'conferenceName' : 'specialty', label: conference ? 'Conference name' : 'Specialty', required: true },
    { key: 'slotTime', label: 'Slot', required: true },
    { key: 'countryCode', label: 'Country code', required: true },
    { key: 'mobileNo', label: 'Mobile number', required: true, type: 'tel' },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'hospitalName', label: 'Hospital', required: true },
  ]
  useEffect(() => { requestKey.current = crypto.randomUUID(); dialog.current?.showModal() }, [])
  function close() { if (!locked.current) { dialog.current?.close(); onClose() } }
  async function submit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (locked.current) return
    const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])) as BookingInput
    if (mode !== 'delete') {
      const invalid = validateInput(input, state.type)
      setErrors(invalid)
      if (Object.keys(invalid).length) {
        requestAnimationFrame(() => dialog.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus())
        return
      }
    }
    locked.current = true; setBusy(true); setError('')
    try {
      const id = state.record ? recordId(state.record) : ''
      if (mode !== 'create' && !id) throw new Error('This booking has no stable id and cannot be changed safely.')
      if (mode === 'delete') {
        await api.remove(state.type, id, state.record?.version ?? state.record?.__v)
        onDeleted(state.type, id)
      } else {
        const saved = mode === 'create'
          ? await api.create(state.type, input, requestKey.current)
          : await api.update(state.type, id, input, state.record?.version ?? state.record?.__v)
        if (!recordId(saved)) throw new Error('The server must return the saved booking with an id. Refresh before retrying.')
        onSaved(state.type, saved, mode === 'create' ? undefined : id)
      }
      dialog.current?.close(); onClose()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save this change. Please try again.') }
    finally { locked.current = false; setBusy(false) }
  }
  return <dialog ref={dialog} aria-labelledby={uid + '-title'} onCancel={event => { event.preventDefault(); close() }}
    className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50">
    <header className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{conference ? 'Conference' : 'Mantram'}</p>
        <h2 id={uid + '-title'} className="mt-1 text-xl font-bold">{mode === 'create' ? 'Create booking' : mode === 'edit' ? 'Edit booking' : mode === 'delete' ? 'Delete booking?' : 'Booking details'}</h2></div>
      <button type="button" className={CRUD_BUTTON} aria-label="Close dialog" disabled={busy} onClick={close}><X className="h-4 w-4" /></button>
    </header>
    {mode === 'view' ? <>
      <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        {[{ label: 'Booking number', value: text(state.record?.bookingNo) }, ...fields.map(field => ({ label: field.label, value: text(state.record?.[field.key]) })), { label: 'Created (Asia/Kolkata)', value: createdLabel(state.record || {}) }].map(field =>
          <div key={field.label}><dt className="text-xs font-semibold text-slate-500">{field.label}</dt><dd className="mt-1 break-words text-sm">{field.value || '—'}</dd></div>)}
      </dl>
      <footer className="flex justify-end gap-2 border-t border-slate-100 p-5"><button type="button" className={CRUD_BUTTON} onClick={close}>Close</button><button type="button" className={CRUD_PRIMARY} disabled={!recordId(state.record || {})} onClick={() => setMode('edit')}>Edit booking</button></footer>
    </> : mode === 'delete' ? <>
      <div className="space-y-3 p-5 text-sm"><p>Delete booking <strong>{text(state.record?.bookingNo) || 'without a booking number'}</strong> for <strong>{person(state.record || {}, state.type) || 'this person'}</strong>?</p><p className="text-slate-500">This removes the booking record. There is no undo action on this page.</p>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-rose-700">{error}</p>}</div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 p-5"><button type="button" autoFocus className={CRUD_BUTTON} disabled={busy} onClick={close}>Keep booking</button><button type="button" className={CRUD_BUTTON + ' !border-rose-600 !bg-rose-600 !text-white'} disabled={busy} onClick={() => submit()}>{busy ? 'Deleting…' : 'Delete booking'}</button></footer>
    </> : <form noValidate onSubmit={submit} aria-busy={busy}>
      <div className="p-5"><p className="mb-5 text-xs text-slate-500">Fields marked * are required. Booking number and creation date are assigned by the server.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{fields.map(field => <label key={field.key} htmlFor={uid + field.key} className="block text-sm font-medium text-slate-700">{field.label}{field.required ? ' *' : ''}
          <input id={uid + field.key} name={field.key} type={field.type || 'text'} required={field.required} maxLength={200} disabled={busy} value={form[field.key] || ''}
            aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? uid + field.key + '-error' : undefined}
            onChange={event => { setForm(current => ({ ...current, [field.key]: event.target.value })); setErrors(current => ({ ...current, [field.key]: undefined })); requestKey.current = crypto.randomUUID() }}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base font-normal focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50" />
          {errors[field.key] && <span id={uid + field.key + '-error'} className="mt-1 block text-xs text-rose-600">{errors[field.key]}</span>}
        </label>)}</div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </div><footer className="flex justify-end gap-2 border-t border-slate-100 p-5"><button type="button" className={CRUD_BUTTON} disabled={busy} onClick={close}>Cancel</button><button type="submit" className={CRUD_PRIMARY} disabled={busy}>{busy ? 'Saving…' : mode === 'create' ? 'Create booking' : 'Save changes'}</button></footer>
    </form>}
  </dialog>
}

export default function AdminBookingsClient({
  conference,
  mantram,
  loadErrors,
  api = DEFAULT_API,
}: Props) {
  const id = useId()
  // Server props seed the list; Refresh fetches subsequent snapshots.
  const [bookingData, setBookingData] = useState<Record<BookingType, BookingRecord[]>>({
    conference: Array.isArray(conference) ? conference : [],
    mantram: Array.isArray(mantram) ? mantram : [],
  })
  const [listErrors, setListErrors] = useState<BookingLoadErrors>(loadErrors || {})
  const [crud, setCrud] = useState<CrudState | null>(null)
  const [crudNotice, setCrudNotice] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const refreshLock = useRef(false)
  async function refreshBookings() {
    if (refreshLock.current) return
    refreshLock.current = true
    setRefreshing(true)
    const target = bookingType
    try {
      const rows = await api.list(target)
      setBookingData(current => ({ ...current, [target]: rows }))
      setListErrors(current => ({ ...current, [target]: undefined }))
      setCrudNotice('Bookings refreshed.')
    } catch (error) {
      setListErrors(current => ({ ...current, [target]: error instanceof Error ? error.message : 'Could not refresh bookings.' }))
    } finally { refreshLock.current = false; setRefreshing(false) }
  }
  function actions(row: TableRow) {
    return <div className="flex flex-wrap gap-1.5">
      <button type="button" className={CRUD_BUTTON} disabled={refreshing} aria-label={'View booking ' + row.bookingNo} onClick={() => setCrud({ mode: 'view', type: bookingType, record: row.original })}><Eye className="h-3.5 w-3.5" />View</button>
      <button type="button" className={CRUD_BUTTON} disabled={refreshing || !recordId(row.original)} aria-label={'Edit booking ' + row.bookingNo} onClick={() => setCrud({ mode: 'edit', type: bookingType, record: row.original })}><Pencil className="h-3.5 w-3.5" />Edit</button>
      <button type="button" className={CRUD_BUTTON + ' !text-rose-600'} disabled={refreshing || !recordId(row.original)} aria-label={'Delete booking ' + row.bookingNo} onClick={() => setCrud({ mode: 'delete', type: bookingType, record: row.original })}><Trash2 className="h-3.5 w-3.5" />Delete</button>
    </div>
  }

  const typeDropdownRef =
    useRef<HTMLDivElement>(null)

  const searchRef =
    useRef<HTMLInputElement>(null)

  const [bookingType, setBookingType] =
    useState<BookingType>('conference')

  const [isTypeOpen, setIsTypeOpen] =
    useState(false)

  const [query, setQuery] =
    useState('')

  const [sortConfig, setSortConfig] =
    useState<SortConfig>({
      key: 'createdAt',
      direction: 'desc',
    })

  const [pageSize, setPageSize] =
    useState(25)

  const [page, setPage] =
    useState(1)

  const [
    exportError,
    setExportError,
  ] = useState('')

  const isConference =
    bookingType === 'conference'

  const title = isConference
    ? 'Conference Bookings'
    : 'Mantram Bookings'

  const loadError =
    listErrors[bookingType]

  const source = bookingData[bookingType]

  const records =
    Array.isArray(source)
      ? source
      : EMPTY_ROWS

  const hasQuery =
    Boolean(query.trim())

  const mobileSortValue =
    `${sortConfig.key}-${sortConfig.direction}`

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsTypeOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  const tableRows = useMemo(
    () =>
      records
        .filter(
          (
            row
          ): row is BookingRecord =>
            Boolean(row) &&
            typeof row === 'object' &&
            !Array.isArray(row)
        )
        .map((row, index) =>
          toTableRow(
            row,
            bookingType,
            index
          )
        ),

    [records, bookingType]
  )

  const filteredRows =
    useMemo(() => {
      const terms = normalize(query)
        .split(' ')
        .filter(Boolean)

      return [...tableRows]
        .filter((row) =>
          terms.every((term) =>
            row.searchText.includes(term)
          )
        )
        .sort((a, b) =>
          compareRows(
            a,
            b,
            sortConfig
          )
        )
    }, [
      tableRows,
      query,
      sortConfig,
    ])

  const totalPages =
    pageSize === 0
      ? 1
      : Math.max(
          1,
          Math.ceil(
            filteredRows.length /
              pageSize
          )
        )

  const currentPage =
    Math.min(
      page,
      totalPages
    )

  const startIndex =
    pageSize === 0
      ? 0
      : (currentPage - 1) *
        pageSize

  const visibleRows =
    pageSize === 0
      ? filteredRows
      : filteredRows.slice(
          startIndex,
          startIndex + pageSize
        )

  const firstRow =
    filteredRows.length
      ? startIndex + 1
      : 0

  const lastRow =
    startIndex +
    visibleRows.length

  const pageNumbers =
    useMemo(() => {
      const values: Array<
        number | 'ellipsis'
      > = []

      for (
        let current = 1;
        current <= totalPages;
        current += 1
      ) {
        const shouldShow =
          current === 1 ||
          current ===
            totalPages ||
          (current >=
            currentPage - 1 &&
            current <=
              currentPage + 1)

        if (!shouldShow) {
          continue
        }

        const previous =
          values[
            values.length - 1
          ]

        if (
          typeof previous ===
            'number' &&
          current - previous > 1
        ) {
          values.push('ellipsis')
        }

        values.push(current)
      }

      return values
    }, [
      currentPage,
      totalPages,
    ])

  function changeType(
    value: BookingType
  ) {
    setBookingType(value)

    setIsTypeOpen(false)

    setQuery('')

    setSortConfig({
      key: 'createdAt',
      direction: 'desc',
    })

    setPage(1)

    setExportError('')
  }

  function clearSearch() {
    setQuery('')
    setPage(1)

    searchRef.current?.focus()
  }

  function requestSort(
    key: SortKey
  ) {
    setSortConfig(
      (current) => {
        if (
          current.key === key
        ) {
          return {
            key,

            direction:
              current.direction ===
              'asc'
                ? 'desc'
                : 'asc',
          }
        }

        return {
          key,

          direction:
            key === 'createdAt'
              ? 'desc'
              : 'asc',
        }
      }
    )

    setPage(1)
  }

  function handleMobileSort(
    value: string
  ) {
    const selected =
      MOBILE_SORT_OPTIONS.find(
        (option) =>
          option.value === value
      )

    if (!selected) {
      return
    }

    setSortConfig({
      key: selected.key,
      direction:
        selected.direction,
    })

    setPage(1)
  }

  function exportRows() {
    setExportError('')

    try {
      downloadCSV(
        filteredRows.map(
          (row) =>
            row.original
        ),

        `${bookingType}_bookings${
          hasQuery
            ? '_filtered'
            : ''
        }.csv`
      )
    } catch {
      setExportError(
        'The CSV could not be downloaded. Please try again.'
      )
    }
  }

  function SortIcon({
    column,
  }: {
    column: SortKey
  }) {
    const active =
      sortConfig.key === column

    if (!active) {
      return (
        <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )
    }

    return sortConfig.direction ===
      'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
    )
  }

  function SortableHeader({
    label,
    column,
    width,
  }: {
    label: string
    column: SortKey
    width?: string
  }) {
    const active =
      sortConfig.key === column

    return (
      <th
        scope="col"
        onClick={() =>
          requestSort(column)
        }
        aria-sort={
          active
            ? sortConfig.direction ===
              'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }
        className={`group cursor-pointer select-none border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100/60 ${
          width ?? ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={
              active
                ? 'font-bold text-indigo-700'
                : 'group-hover:text-gray-700'
            }
          >
            {label}
          </span>

          <SortIcon
            column={column}
          />
        </div>
      </th>
    )
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-4 font-sans text-slate-900 sm:gap-5 lg:gap-6">
      {/* Page title */}
      <header className="px-0.5 sm:px-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Booking Administration
        </h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Create, view, edit and delete Conference and Mantram bookings.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={CRUD_BUTTON} disabled={refreshing} onClick={refreshBookings}><RefreshCw className="h-4 w-4" />{refreshing ? 'Refreshing…' : 'Refresh'}</button>
          <button type="button" className={CRUD_PRIMARY} disabled={refreshing || Boolean(loadError)} onClick={() => setCrud({ mode: 'create', type: bookingType })}><Plus className="h-4 w-4" />Create booking</button>
        </div>
      </div>
      {crudNotice && <p role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{crudNotice}</p>}
      {/* Responsive action bar */}
      <div className="sticky top-2 z-20 px-0.5 sm:px-1">
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-md transition-shadow duration-300 hover:shadow-md">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[245px_minmax(320px,1fr)_auto] xl:items-center">
            {/* Booking type */}
            <div
              ref={
                typeDropdownRef
              }
              className="relative min-w-0"
            >
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={
                  isTypeOpen
                }
                onClick={() =>
                  setIsTypeOpen(
                    (open) =>
                      !open
                  )
                }
                className={`relative w-full cursor-pointer rounded-xl border py-2.5 pl-4 pr-10 text-left text-sm font-medium transition-all duration-200 focus:outline-none ${
                  isTypeOpen
                    ? 'border-indigo-500 bg-white text-slate-900 ring-4 ring-indigo-500/10'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="block truncate">
                  {title}
                </span>

                <ChevronDown
                  className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
                    isTypeOpen
                      ? 'rotate-180'
                      : ''
                  }`}
                />
              </button>

              {isTypeOpen && (
                <div
                  role="listbox"
                  aria-label="Booking type"
                  className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl"
                >
                  {[
                    {
                      value:
                        'conference' as BookingType,

                      label:
                        'Conference Bookings',
                    },

                    {
                      value:
                        'mantram' as BookingType,

                      label:
                        'Mantram Bookings',
                    },
                  ].map(
                    (option) => {
                      const selected =
                        bookingType ===
                        option.value

                      return (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          role="option"
                          aria-selected={
                            selected
                          }
                          onClick={() =>
                            changeType(
                              option.value
                            )
                          }
                          className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            selected
                              ? 'bg-indigo-50 font-semibold text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>
                            {
                              option.label
                            }
                          </span>

                          {selected && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )
                    }
                  )}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                ref={searchRef}
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(
                  event
                ) => {
                  setQuery(
                    event.target
                      .value
                  )

                  setPage(1)
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    'Escape'
                  ) {
                    clearSearch()
                  }
                }}
                placeholder="Search bookings..."
                autoComplete="off"
                spellCheck={false}
                disabled={Boolean(
                  loadError
                )}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-search-cancel-button]:appearance-none"
              />

              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={
                    clearSearch
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Export - desktop position */}
            <button
              type="button"
              onClick={exportRows}
              disabled={
                Boolean(
                  loadError
                ) ||
                filteredRows.length ===
                  0
              }
              className="group hidden h-[42px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 xl:flex"
            >
              <Download className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-600" />

              Export CSV
            </button>

            {/* Mobile/tablet sorting */}
            <div className="xl:hidden">
              <label
                htmlFor={`${id}-mobile-sort`}
                className="sr-only"
              >
                Sort bookings
              </label>

              <select
                id={`${id}-mobile-sort`}
                value={
                  mobileSortValue
                }
                disabled={Boolean(
                  loadError
                )}
                onChange={(
                  event
                ) =>
                  handleMobileSort(
                    event.target
                      .value
                  )
                }
                className="h-[42px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {MOBILE_SORT_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      Sort: {option.label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Export - mobile/tablet */}
            <button
              type="button"
              onClick={exportRows}
              disabled={
                Boolean(
                  loadError
                ) ||
                filteredRows.length ===
                  0
              }
              className="group flex h-[42px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 xl:hidden"
            >
              <Download className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-600" />

              Export CSV
            </button>
          </div>
        </div>
      </div>

      {exportError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {exportError}
        </p>
      )}

      {/* Main container */}
      <section className="relative flex min-w-0 flex-grow flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loadError ? (
          <div className="px-4 py-14 sm:px-5 sm:py-16">
            <p
              role="alert"
              className="text-sm font-medium text-rose-700"
            >
              {loadError}
            </p>
          </div>
        ) : visibleRows.length ===
          0 ? (
          <div className="px-4 py-14 text-center sm:px-5 sm:py-16">
            <p className="text-sm font-medium text-slate-600">
              {hasQuery
                ? 'No matching bookings found.'
                : 'No bookings available.'}
            </p>

            {hasQuery && (
              <button
                type="button"
                onClick={
                  clearSearch
                }
                className="mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* =========================
                MOBILE / TABLET VIEW
               ========================= */}
            <div className="grid grid-cols-1 gap-3 bg-slate-50/40 p-3 sm:p-4 lg:grid-cols-2 xl:hidden">
              {visibleRows.map(
                (row) => (
                  <div key={row.key}>
                  <MobileBookingCard
                    row={row}
                    isConference={
                      isConference
                    }
                  />
                  <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white p-3">{actions(row)}</div>
                  </div>
                )
              )}
            </div>

            {/* =========================
                LAPTOP / DESKTOP TABLE
               ========================= */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1160px] border-collapse text-left">
                <caption className="sr-only">
                  {title}. Use
                  sortable table
                  headers to change
                  row order.
                </caption>

                <thead className="sticky top-0 z-[1] bg-gray-50/95 backdrop-blur-sm">
                  <tr>
                    <SortableHeader
                      label="Booking No."
                      column="bookingNo"
                      width="w-[125px]"
                    />

                    <SortableHeader
                      label={
                        isConference
                          ? 'Delegate'
                          : 'Doctor'
                      }
                      column="name"
                      width="w-[175px]"
                    />

                    <SortableHeader
                      label={
                        isConference
                          ? 'Conference'
                          : 'Specialty'
                      }
                      column="detail"
                      width="w-[185px]"
                    />

                    <SortableHeader
                      label="Slot"
                      column="slot"
                      width="w-[135px]"
                    />

                    <th
                      scope="col"
                      className="w-[145px] border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Mobile
                    </th>

                    <th
                      scope="col"
                      className="w-[190px] border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Email
                    </th>

                    <SortableHeader
                      label="Hospital"
                      column="hospital"
                      width="w-[205px]"
                    />

                    <SortableHeader
                      label="Created"
                      column="createdAt"
                      width="w-[145px]"
                    />
                    <th scope="col" className="border-b border-gray-200 px-4 py-3.5 text-xs font-semibold uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100/80 bg-white">
                  {visibleRows.map(
                    (row) => (
                      <tr
                        key={
                          row.key
                        }
                        className="bg-white transition-colors duration-200 hover:bg-slate-50"
                      >
                        {/* Booking */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="hidden rounded-md bg-slate-50 p-1.5 text-slate-400 2xl:block">
                              <FileText className="h-3.5 w-3.5" />
                            </div>

                            <span className="break-all font-mono text-sm font-bold tracking-tight text-slate-700">
                              {row.bookingNo ||
                                '-'}
                            </span>
                          </div>
                        </td>

                        {/* Person */}
                        <th
                          scope="row"
                          className="px-4 py-4 text-left align-middle"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 2xl:flex">
                              <User className="h-4 w-4" />
                            </div>

                            <span className="break-words text-sm font-semibold leading-5 text-slate-900">
                              {row.name ||
                                '-'}
                            </span>
                          </div>
                        </th>

                        {/* Detail */}
                        <td className="px-4 py-4 align-middle text-sm font-medium leading-5 text-slate-700">
                          <span className="break-words">
                            {row.detail ||
                              '-'}
                          </span>
                        </td>

                        {/* Slot */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-start gap-2">
                            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                            <span className="break-words text-sm font-medium leading-5 tabular-nums text-slate-700">
                              {row.slot ||
                                '-'}
                            </span>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td className="px-4 py-4 align-middle text-sm leading-5 tabular-nums text-slate-600">
                          <span className="break-all">
                            {row.phone ||
                              '-'}
                          </span>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-4 align-middle text-sm leading-5 text-slate-600">
                          <span className="break-all">
                            {row.email ||
                              '-'}
                          </span>
                        </td>

                        {/* Hospital */}
                        <td className="px-4 py-4 align-middle">
                          {row.hospital ? (
                            <span
                              className={`inline-flex max-w-[190px] items-start gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-4 shadow-sm ${hospitalStyle(
                                row.hospital
                              )}`}
                            >
                              <Building2 className="mt-0.5 h-3 w-3 shrink-0" />

                              <span className="break-words">
                                {
                                  row.hospital
                                }
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              -
                            </span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-start gap-2 text-slate-500">
                            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                            {row.isoDate ? (
                              <time
                                dateTime={
                                  row.isoDate
                                }
                                className="text-sm leading-5"
                              >
                                <span className="block whitespace-nowrap text-slate-600">
                                  {
                                    row.date
                                  }
                                </span>

                                <span className="block whitespace-nowrap text-xs text-slate-400">
                                  {
                                    row.time
                                  }
                                </span>
                              </time>
                            ) : (
                              <span className="text-sm">
                                {row.date ||
                                  '-'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="min-w-[230px] px-4 py-4 align-middle">{actions(row)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* =========================
                RESPONSIVE PAGINATION
               ========================= */}
            <footer className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Result info */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-start">
                <p
                  role="status"
                  aria-live="polite"
                  className="text-xs font-medium tracking-wide text-slate-500"
                >
                  Showing{' '}
                  <span className="font-bold text-slate-900">
                    {firstRow}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-900">
                    {lastRow}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-900">
                    {
                      filteredRows.length
                    }
                  </span>{' '}
                  results

                  {hasQuery && (
                    <span className="text-slate-400">
                      {' '}
                      /{' '}
                      {
                        tableRows.length
                      }{' '}
                      total
                    </span>
                  )}
                </p>

                {/* Rows */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`${id}-page-size`}
                    className="text-xs font-medium text-slate-500"
                  >
                    Rows
                  </label>

                  <select
                    id={`${id}-page-size`}
                    value={
                      pageSize
                    }
                    onChange={(
                      event
                    ) => {
                      setPageSize(
                        Number(
                          event
                            .target
                            .value
                        )
                      )

                      setPage(1)
                    }}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option
                      value={25}
                    >
                      25
                    </option>

                    <option
                      value={50}
                    >
                      50
                    </option>

                    <option
                      value={100}
                    >
                      100
                    </option>

                    <option
                      value={0}
                    >
                      All
                    </option>
                  </select>
                </div>
              </div>

              {/* Pagination */}
              <div className="w-full overflow-x-auto lg:w-auto">
                <nav
                  aria-label={`${title} pagination`}
                  className="mx-auto flex w-max min-w-fit items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm lg:mx-0"
                >
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={
                      currentPage ===
                      1
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {pageNumbers.map(
                      (
                        item,
                        index
                      ) =>
                        item ===
                        'ellipsis' ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="select-none px-1 text-xs text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={
                              item
                            }
                            type="button"
                            aria-current={
                              item ===
                              currentPage
                                ? 'page'
                                : undefined
                            }
                            onClick={() =>
                              setPage(
                                item
                              )
                            }
                            className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                              item ===
                              currentPage
                                ? 'scale-105 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {item}
                          </button>
                        )
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={
                      currentPage ===
                        totalPages ||
                      totalPages ===
                        0
                    }
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </footer>
          </>
        )}
      </section>
      {crud && <BookingCrudDialog state={crud} api={api} onClose={() => setCrud(null)}
        onSaved={(target, saved, previousId) => {
          setBookingData(current => ({ ...current, [target]: previousId
            ? current[target].map(row => recordId(row) === previousId ? saved : row)
            : [saved, ...current[target].filter(row => recordId(row) !== recordId(saved))] }))
          setCrudNotice(previousId ? 'Booking updated.' : 'Booking created.')
        }}
        onDeleted={(target, bookingId) => {
          setBookingData(current => ({ ...current, [target]: current[target].filter(row => recordId(row) !== bookingId) }))
          setCrudNotice('Booking deleted.')
        }} />}
    </div>
  )
}

