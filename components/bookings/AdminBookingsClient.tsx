'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
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

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return String(value)
  return ''
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function getDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null

  if (
    !(value instanceof Date) &&
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toTableRow(
  row: BookingRecord,
  type: BookingType,
  index: number
): TableRow {
  const rawName = text(type === 'conference' ? row.delegateName : row.doctorName)
  const mobile = text(row.mobileNo)
  const date = getDate(row.createdAt)

  const fields = {
    bookingNo: text(row.bookingNo),
    name: rawName
      ? [text(row.salutation), rawName].filter(Boolean).join(' ')
      : '',
    detail: text(
      type === 'conference' ? row.conferenceName : row.specialty
    ),
    slot: text(row.slotTime),
    phone: mobile
      ? [text(row.countryCode), mobile].filter(Boolean).join(' ')
      : '',
    email: text(row.email),
    hospital: text(row.hospitalName),
  }

  const displayDate = date ? DATE_FORMAT.format(date) : text(row.createdAt)
  const displayTime = date ? TIME_FORMAT.format(date) : ''

  return {
    key: `${type}-${text(row._id) || 'row'}-${index}`,
    original: row,
    ...fields,
    timestamp: date ? date.getTime() : null,
    date: displayDate,
    time: displayTime,
    isoDate: date ? date.toISOString() : '',
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
    if (a.timestamp === null) return b.timestamp === null ? 0 : 1
    if (b.timestamp === null) return -1

    return config.direction === 'desc'
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp
  }

  const valueA =
    config.key === 'bookingNo'
      ? a.bookingNo
      : config.key === 'name'
        ? a.name
        : config.key === 'detail'
          ? a.detail
          : config.key === 'slot'
            ? a.slot
            : a.hospital

  const valueB =
    config.key === 'bookingNo'
      ? b.bookingNo
      : config.key === 'name'
        ? b.name
        : config.key === 'detail'
          ? b.detail
          : config.key === 'slot'
            ? b.slot
            : b.hospital

  if (!valueA) return valueB ? 1 : 0
  if (!valueB) return -1

  const comparison = COLLATOR.compare(valueA, valueB)
  return config.direction === 'desc' ? -comparison : comparison
}

function csvCell(value: unknown): string {
  let result = ''

  if (value !== null && value !== undefined) {
    result =
      typeof value === 'object'
        ? JSON.stringify(value) ?? ''
        : String(value)
  }

  if (
    typeof value === 'string' &&
    /^(?:\s*[=+@\x2D]|[\t\r\n])/.test(result)
  ) {
    result = `'${result}`
  }

  return `"${result.replace(/"/g, '""')}"`
}

function downloadCSV(rows: BookingRecord[], filename: string): void {
  if (!rows.length) return

  const keys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  )

  const lines = [
    keys.map(csvCell).join(','),
    ...rows.map((row) =>
      keys.map((key) => csvCell(row[key])).join(',')
    ),
  ]

  const blob = new Blob(['\uFEFF', lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  try {
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

function hospitalStyle(value: string): string {
  if (!value) {
    return 'border-slate-200 bg-slate-50 text-slate-600'
  }

  let hash = 0

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }

  return HOSPITAL_STYLES[Math.abs(hash) % HOSPITAL_STYLES.length]
}

export default function AdminBookingsClient({
  conference,
  mantram,
  loadErrors,
}: Props) {
  const id = useId()
  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const [bookingType, setBookingType] =
    useState<BookingType>('conference')
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [exportError, setExportError] = useState('')

  const isConference = bookingType === 'conference'
  const title = isConference
    ? 'Conference Bookings'
    : 'Mantram Bookings'

  const loadError = loadErrors?.[bookingType]
  const source = isConference ? conference : mantram
  const records = Array.isArray(source) ? source : EMPTY_ROWS
  const hasQuery = Boolean(query.trim())

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTypeOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const tableRows = useMemo(
    () =>
      records
        .filter(
          (row): row is BookingRecord =>
            Boolean(row) &&
            typeof row === 'object' &&
            !Array.isArray(row)
        )
        .map((row, index) =>
          toTableRow(row, bookingType, index)
        ),
    [records, bookingType]
  )

  const filteredRows = useMemo(() => {
    const terms = normalize(query).split(' ').filter(Boolean)

    return tableRows
      .filter((row) =>
        terms.every((term) => row.searchText.includes(term))
      )
      .sort((a, b) => compareRows(a, b, sortConfig))
  }, [tableRows, query, sortConfig])

  const totalPages =
    pageSize === 0
      ? 1
      : Math.max(1, Math.ceil(filteredRows.length / pageSize))

  const currentPage = Math.min(page, totalPages)
  const startIndex =
    pageSize === 0 ? 0 : (currentPage - 1) * pageSize

  const visibleRows =
    pageSize === 0
      ? filteredRows
      : filteredRows.slice(startIndex, startIndex + pageSize)

  const firstRow = filteredRows.length ? startIndex + 1 : 0
  const lastRow = startIndex + visibleRows.length

  const pageNumbers = useMemo(() => {
    const values: Array<number | 'ellipsis'> = []

    for (let current = 1; current <= totalPages; current += 1) {
      const shouldShow =
        current === 1 ||
        current === totalPages ||
        (current >= currentPage - 1 &&
          current <= currentPage + 1)

      if (!shouldShow) continue

      const previous = values[values.length - 1]

      if (
        typeof previous === 'number' &&
        current - previous > 1
      ) {
        values.push('ellipsis')
      }

      values.push(current)
    }

    return values
  }, [currentPage, totalPages])

  function changeType(value: BookingType) {
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

  function requestSort(key: SortKey) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction:
            current.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        key,
        direction: key === 'createdAt' ? 'desc' : 'asc',
      }
    })

    setPage(1)
  }

  function exportRows() {
    setExportError('')

    try {
      downloadCSV(
        filteredRows.map((row) => row.original),
        `${bookingType}_bookings${hasQuery ? '_filtered' : ''}.csv`
      )
    } catch {
      setExportError(
        'The CSV could not be downloaded. Please try again.'
      )
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    const active = sortConfig.key === column

    if (!active) {
      return (
        <ArrowUpDown className="h-3.5 w-3.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )
    }

    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
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
    const active = sortConfig.key === column

    return (
      <th
        scope="col"
        onClick={() => requestSort(column)}
        aria-sort={
          active
            ? sortConfig.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }
        className={`group cursor-pointer select-none border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-100/50 ${width ?? ''}`}
      >
        <div className="flex items-center justify-start gap-2">
          <span
            className={
              active
                ? 'font-bold text-blue-700'
                : 'group-hover:text-gray-700'
            }
          >
            {label}
          </span>

          <span className="flex items-center">
            <SortIcon column={column} />
          </span>
        </div>
      </th>
    )
  }

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-6 font-sans text-slate-900">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bookings Admin
        </h1>
      </header>

      {/* Certificate-admin style quick action bar */}
      <div className="sticky top-2 z-[20] px-1">
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md lg:flex-row lg:items-center">
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
            {/* Booking type dropdown */}
            <div
              ref={typeDropdownRef}
              className="relative flex-grow sm:min-w-[245px] sm:flex-grow-0"
            >
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isTypeOpen}
                onClick={() => setIsTypeOpen((open) => !open)}
                className={`relative w-full cursor-pointer rounded-xl border py-2.5 pl-4 pr-10 text-left text-sm font-medium transition-all duration-200 focus:outline-none ${
                  isTypeOpen
                    ? 'border-indigo-500 bg-white text-slate-900 ring-4 ring-indigo-500/10'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="block truncate">{title}</span>

                <ChevronDown
                  className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200 ${
                    isTypeOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isTypeOpen && (
                <div
                  role="listbox"
                  aria-label="Booking type"
                  className="absolute left-0 right-0 top-full z-[100] mt-2 origin-top overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                >
                  {[
                    {
                      value: 'conference' as BookingType,
                      label: 'Conference Bookings',
                    },
                    {
                      value: 'mantram' as BookingType,
                      label: 'Mantram Bookings',
                    },
                  ].map((option) => {
                    const selected =
                      bookingType === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() =>
                          changeType(option.value)
                        }
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? 'bg-indigo-50 font-semibold text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{option.label}</span>

                        {selected && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="hidden h-8 w-px bg-slate-200/60 sm:block" />

            {/* Search */}
            <div className="relative w-full sm:min-w-[320px] lg:min-w-[380px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                ref={searchRef}
                id={`${id}-search`}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') clearSearch()
                }}
                placeholder="Search bookings..."
                autoComplete="off"
                spellCheck={false}
                disabled={Boolean(loadError)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-search-cancel-button]:appearance-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Export */}
          <button
            type="button"
            onClick={exportRows}
            disabled={
              Boolean(loadError) || filteredRows.length === 0
            }
            className="group flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
          >
            <Download className="mr-2 h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {exportError && (
        <p
          role="alert"
          className="mx-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {exportError}
        </p>
      )}

      {/* Certificate-admin style table card */}
      <section className="relative flex min-w-0 flex-grow flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loadError ? (
          <div className="px-5 py-16">
            <p
              role="alert"
              className="text-sm font-medium text-rose-700"
            >
              {loadError}
            </p>
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">
              {hasQuery
                ? 'No matching bookings found.'
                : 'No bookings available.'}
            </p>

            {hasQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1320px] border-collapse text-left">
                <caption className="sr-only">
                  {title}. Use sortable table headers to change
                  row order.
                </caption>

                <thead className="sticky top-0 z-[1] bg-gray-50/50 backdrop-blur-sm">
                  <tr>
                    <SortableHeader
                      label="Booking No."
                      column="bookingNo"
                      width="w-[130px]"
                    />

                    <SortableHeader
                      label={
                        isConference ? 'Delegate' : 'Doctor'
                      }
                      column="name"
                      width="w-[190px]"
                    />

                    <SortableHeader
                      label={
                        isConference
                          ? 'Conference'
                          : 'Specialty'
                      }
                      column="detail"
                      width="w-[200px]"
                    />

                    <SortableHeader
                      label="Slot"
                      column="slot"
                      width="w-[150px]"
                    />

                    <th
                      scope="col"
                      className="w-[170px] border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Mobile
                    </th>

                    <th
                      scope="col"
                      className="w-[220px] border-b border-gray-200/80 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      Email
                    </th>

                    <SortableHeader
                      label="Hospital"
                      column="hospital"
                      width="w-[230px]"
                    />

                    <SortableHeader
                      label="Created"
                      column="createdAt"
                      width="w-[180px]"
                    />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100/80 bg-white">
                  {visibleRows.map((row) => (
                    <tr
                      key={row.key}
                      className="bg-white transition-colors duration-200 hover:bg-slate-50"
                    >
                      {/* Booking number */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="hidden rounded-md bg-slate-50 p-1.5 text-slate-400 xl:block">
                            <FileText className="h-3.5 w-3.5" />
                          </div>

                          <span className="break-all font-mono text-sm font-bold tracking-tight text-slate-700">
                            {row.bookingNo || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Person */}
                      <th
                        scope="row"
                        className="px-4 py-4 text-left align-middle"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 xl:flex">
                            <User className="h-4 w-4" />
                          </div>

                          <span className="text-sm font-semibold text-slate-900">
                            {row.name || '-'}
                          </span>
                        </div>
                      </th>

                      {/* Conference / specialty */}
                      <td className="px-4 py-4 align-middle text-sm font-medium leading-6 text-slate-700">
                        {row.detail || '-'}
                      </td>

                      {/* Slot */}
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Clock3 className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-sm font-medium tabular-nums text-slate-700">
                            {row.slot || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-4 align-middle text-sm leading-6 tabular-nums text-slate-600">
                        {row.phone || '-'}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 align-middle text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
                        {row.email || '-'}
                      </td>

                      {/* Hospital */}
                      <td className="px-4 py-4 align-middle">
                        {row.hospital ? (
                          <span
                            className={`inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm ${hospitalStyle(
                              row.hospital
                            )}`}
                          >
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="whitespace-normal leading-4">
                              {row.hospital}
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
                              dateTime={row.isoDate}
                              className="text-sm leading-5"
                            >
                              <span className="block text-slate-600">
                                {row.date}
                              </span>
                              <span className="block text-xs text-slate-400">
                                {row.time}
                              </span>
                            </time>
                          ) : (
                            <span className="text-sm">
                              {row.date || '-'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Certificate-admin style pagination */}
            <footer className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/40 p-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-4">
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
                    {filteredRows.length}
                  </span>{' '}
                  results
                  {hasQuery && (
                    <span className="text-slate-400">
                      {' '}
                      / {tableRows.length} total
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`${id}-page-size`}
                    className="text-xs font-medium text-slate-500"
                  >
                    Rows
                  </label>

                  <select
                    id={`${id}-page-size`}
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 outline-none transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={0}>All</option>
                  </select>
                </div>
              </div>

              <nav
                aria-label={`${title} pagination`}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1 shadow-sm"
              >
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="select-none px-1 text-xs text-slate-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        aria-current={
                          item === currentPage
                            ? 'page'
                            : undefined
                        }
                        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95 ${
                          item === currentPage
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
                    currentPage === totalPages || totalPages === 0
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
    </div>
  )
}
