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

export default function AdminBookingsClient({
  conference,
  mantram,
  loadErrors,
}: Props) {
  const id = useId()

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
    loadErrors?.[bookingType]

  const source = isConference
    ? conference
    : mantram

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
          Bookings Admin
        </h1>
      </header>

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
                  <MobileBookingCard
                    key={
                      row.key
                    }
                    row={row}
                    isConference={
                      isConference
                    }
                  />
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
    </div>
  )
}