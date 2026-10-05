'use client'

/**
 * Port dari UBSC-LARAVEL/resources/js/Components/Booking/BookingSection.tsx.
 *
 * ===== Batas RSC/client =====
 * Client leaf: seluruh state pemilihan (openId, tanggal, unit, cache slot/bulan) dan pengambilan
 * jadwal ada di sini. Daftar fasilitasnya sendiri PUBLIK dan datang sebagai prop dari Server
 * Component halaman (`getBookingFacilities()`), jadi /booking tetap ISR 600s.
 *
 * Jadwal SENGAJA TIDAK dipindah ke TanStack Query. ClassMonthPicker yang sudah ada menuntut prop
 * `data`/`loading`/`error`/`onRetry` dari induknya, dan mesin state Record-berkunci di sumber
 * (`${facilityId}:${unitId}` + bulan) memetakan satu-lawan-satu ke prop itu. Menggantinya dengan
 * useQuery berarti menulis ulang kontrak komponen yang sudah mendarat — bukan porting.
 *
 * ===== Perubahan terhadap sumber =====
 *   - `export default function` -> named export `BookingSection`.
 *   - `axios` -> `axiosInstance` ('@/lib/axios', baseURL '/api').
 *       `route('booking.slots')` -> `/public/booking/slots`
 *       `route('booking.month')` -> `/public/booking/month`
 *     Query param snake -> camel: `facility_id`->`facilityId`, `facility_unit_id`->`facilityUnitId`.
 *     Envelope `{ success, data }` di-unwrap (`res.data.data`) -> `SlotsDto` / `MonthDto`.
 *   - `res.data.requires_unit` -> `payload.requiresUnit`; `res.data.reason === 'month_closed'` tetap.
 *   - Prop `facilities` bertipe `BookingFacilityDto[]` (kontrak Fase 6), bukan interface
 *     `BackendFacility` lokal. Rename snake -> camel mengikuti DTO: `booking_mode`->`bookingMode`,
 *     `class_code`->`classCode`, `venue_type`->`venueType`. `ApiSlot` lokal diganti `SlotDto`,
 *     yang sudah camelCase (`start_time`->`startTime`, `price_raw`->`priceRaw`,
 *     `was_booked`->`wasBooked`, `facility_unit_id`->`facilityUnitId`).
 *   - Semua id `number` -> `string` (uuid): `slotKeyFor`, `selectedUnits`, `fetchSlots`,
 *     `fetchMonth`, `handleUnitChange`. `String(f.id)` dan `String(idx + 1).padStart(2, '0')`
 *     dipertahankan verbatim (addendum Fase 5).
 *   - Helper lokal `todayStr()` dihapus, diganti `todayStr` dari '@/lib/calendar' (zona dikunci WIB
 *     seperti `currentMonthKey`, supaya render server dan klien tidak berbeda hari).
 *   - `f.booking_mode ?? 'court'`: di DTO `bookingMode` bertipe `string` WAJIB, jadi nilainya
 *     di-cast ke union `'court' | 'class'`; `?? 'court'` dipertahankan sebagai penjaga yang sama
 *     seperti sumber.
 *
 * ===== classPairs (spec-BookingSection.json), 1 buah =====
 *   kotak merah label: `size-[17px] rounded-[5px] bg-accent-red flex-shrink-0` -> `… shrink-0`
 * deadTokens: tidak ada.
 *
 * CATATAN FIDELITAS: `max-w` pada kedua pembungkus adalah TOKEN MATI (tailwind.config.js Laravel
 * tidak memperluas maxWidth, jadi `max-w` tanpa skala tidak menghasilkan CSS). Dibiarkan apa adanya,
 * sama seperti AboutSectionContact dan PricingFacilityList yang sudah di-port.
 */

import { useState } from 'react'
import { SectionDivider } from '@/components/landing/SectionDivider'
import { ClassMonthPicker } from '@/components/booking/class/ClassMonthPicker'
import type { ClassMonthData } from '@/components/booking/class/types'
import axiosInstance from '@/lib/axios'
import { currentMonthKey, todayStr } from '@/lib/calendar'
import type { ApiSuccess, BookingFacilityDto, MonthDto, SlotDto, SlotsDto } from '@/types/contracts/contracts'
import { BookingListItem, type BookingFacility } from './BookingListItem'
import type { BookingFees } from './FeeNote'

interface Props {
  facilities?: BookingFacilityDto[]
  fees: BookingFees
}

const slotKeyFor = (facilityId: string, facilityUnitId?: string | null) => `${facilityId}:${facilityUnitId ?? 'parent'}`

export function BookingSection({ facilities = [], fees }: Props) {
  const [openId, setOpenId] = useState<string>('')
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({})
  const [slots, setSlots] = useState<Record<string, SlotDto[]>>({})
  const [loadingSlot, setLoadingSlot] = useState<Record<string, boolean>>({})
  const [slotError, setSlotError] = useState<Record<string, string | null>>({})
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string | null>>({})

  const fetchSlots = async (facilityId: string, date: string, facilityUnitId?: string | null) => {
    const key = slotKeyFor(facilityId, facilityUnitId)
    setLoadingSlot((p) => ({ ...p, [key]: true }))
    setSlotError((p) => ({ ...p, [key]: null }))
    try {
      const res = await axiosInstance.get<ApiSuccess<SlotsDto>>('/public/booking/slots', {
        params: {
          facilityId,
          date,
          ...(facilityUnitId ? { facilityUnitId } : {})
        }
      })
      const payload = res.data.data
      if (payload.closed) {
        setSlotError((p) => ({
          ...p,
          [key]: payload.reason === 'month_closed' ? 'Bulan ini belum dibuka untuk reservasi.' : 'Fasilitas tutup pada tanggal ini.'
        }))
        setSlots((p) => ({ ...p, [key]: [] }))
      } else if (payload.requiresUnit) {
        setSlotError((p) => ({
          ...p,
          [key]: 'Pilih unit fasilitas untuk melihat jadwal.'
        }))
        setSlots((p) => ({ ...p, [key]: [] }))
      } else {
        setSlots((p) => ({ ...p, [key]: payload.slots }))
      }
    } catch {
      setSlotError((p) => ({
        ...p,
        [key]: 'Gagal memuat jadwal. Coba lagi.'
      }))
    } finally {
      setLoadingSlot((p) => ({ ...p, [key]: false }))
    }
  }

  // Class facilities are read a month at a time. Same key convention as the
  // day cache, plus the month, so a class and a court sit in the same list
  // without either knowing about the other.
  const [classMonth, setClassMonth] = useState<Record<string, string>>({})
  const [classData, setClassData] = useState<Record<string, ClassMonthData | null>>({})
  const [classLoading, setClassLoading] = useState<Record<string, boolean>>({})
  const [classError, setClassError] = useState<Record<string, string | null>>({})

  const monthKeyFor = (facilityId: string, unitId: string | null, month: string) => `${slotKeyFor(facilityId, unitId)}:${month}`

  const fetchMonth = async (facilityId: string, unitId: string | null, month: string) => {
    const key = monthKeyFor(facilityId, unitId, month)
    setClassLoading((p) => ({ ...p, [key]: true }))
    setClassError((p) => ({ ...p, [key]: null }))

    try {
      const res = await axiosInstance.get<ApiSuccess<MonthDto>>('/public/booking/month', {
        params: {
          facilityId,
          month,
          ...(unitId ? { facilityUnitId: unitId } : {})
        }
      })
      setClassData((p) => ({ ...p, [key]: res.data.data }))
    } catch {
      setClassError((p) => ({ ...p, [key]: 'Gagal memuat jadwal. Coba lagi.' }))
    } finally {
      setClassLoading((p) => ({ ...p, [key]: false }))
    }
  }

  const handleToggle = (item: BookingFacility) => {
    const isOpening = openId !== item.id
    setOpenId(isOpening ? item.id : '')
    if (!isOpening) return

    const key = String(item.facilityId)
    const nextUnitId = item.selectedUnitId ?? item.units[0]?.id ?? null

    if (nextUnitId && selectedUnits[key] !== nextUnitId) {
      setSelectedUnits((p) => ({ ...p, [key]: nextUnitId }))
    }

    if (item.bookingMode === 'class') {
      const month = classMonth[key] ?? currentMonthKey()
      setClassMonth((p) => ({ ...p, [key]: month }))
      fetchMonth(item.facilityId, nextUnitId, month)
      return
    }

    fetchSlots(item.facilityId, selectedDates[key] ?? todayStr(), nextUnitId)
  }

  const handleMonthChange = (item: BookingFacility, month: string) => {
    setClassMonth((p) => ({ ...p, [String(item.facilityId)]: month }))
    fetchMonth(item.facilityId, item.selectedUnitId ?? null, month)
  }

  const handleDateChange = (item: BookingFacility, date: string) => {
    const key = String(item.facilityId)
    setSelectedDates((p) => ({ ...p, [key]: date }))
    const unitId = item.selectedUnitId ?? item.units[0]?.id ?? null
    fetchSlots(item.facilityId, date, unitId)
  }

  const handleUnitChange = (item: BookingFacility, unitId: string) => {
    const key = String(item.facilityId)
    setSelectedUnits((p) => ({ ...p, [key]: unitId }))

    if (item.bookingMode === 'class') {
      const month = classMonth[key] ?? currentMonthKey()
      fetchMonth(item.facilityId, unitId, month)
      return
    }

    fetchSlots(item.facilityId, selectedDates[key] ?? todayStr(), unitId)
  }

  const bookingsData: BookingFacility[] = facilities.map((f, idx) => {
    const key = String(f.id)
    const units = f.units ?? []
    const selectedUnitId = selectedUnits[key] ?? units[0]?.id ?? null
    const apiSlots = slots[slotKeyFor(f.id, selectedUnitId)] ?? []
    return {
      id: String(idx + 1).padStart(2, '0'),
      facilityId: f.id,
      bookingMode: (f.bookingMode as BookingFacility['bookingMode']) ?? 'court',
      title: `/${f.name}`,
      code: f.classCode ?? `/Arena ${String(idx + 1).padStart(3, '0')}/`,
      image: f.image || '/assets/images/comingsoon.avif',
      badgeLocation: f.location ?? 'Veteran',
      badgeType: f.venueType ?? f.category,
      units,
      selectedUnitId,
      availableSlots: apiSlots.map((s) => ({
        time: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        price: s.price,
        priceRaw: s.priceRaw ?? 0,
        status: s.status,
        past: s.past ?? false,
        wasBooked: s.wasBooked ?? false,
        facilityUnitId: s.facilityUnitId ?? null
      }))
    }
  })

  return (
    <section className="overflow-x-clip bg-white" id="booking-content">
      <div className="max-w mx-auto px-6 pt-8 sm:px-10 sm:pt-12 lg:px-16 xl:px-24 xl:pt-10">
        <SectionDivider number="01" title="Reservasi Disini" subtitle="01 bookingpage" theme="light" />
      </div>
      <div className="max-w mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="mt-16 mb-16 grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3">
              <div className="size-[17px] shrink-0 rounded-[5px] bg-accent-red" />
              <span className="font-bdo text-[clamp(1rem,1.25vw,24px)] font-normal text-black">Reservasi Lewat Website</span>
            </div>
          </div>
          <div className="lg:col-span-9">
            <h2 className="font-bdo text-[clamp(2rem,2.7vw,52px)] leading-[1.1] font-medium tracking-[-0.021em] text-black">
              Booking fasilitas olahraga terbaik kami kapan saja, langsung dari website.{' '}
              <span style={{ color: '#ABABAB' }}>Pilih jadwal, pilih fasilitas,</span> selesai dalam hitungan menit.
            </h2>
          </div>
        </div>

        <div className="flex w-full flex-col border-t border-gray-200">
          {bookingsData.map((item) => {
            const dateKey = String(item.facilityId)
            const slotKey = slotKeyFor(item.facilityId, item.selectedUnitId)
            return (
              <BookingListItem
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                fees={fees}
                onToggle={() => handleToggle(item)}
                selectedDate={selectedDates[dateKey] ?? todayStr()}
                onDateChange={(date) => handleDateChange(item, date)}
                onUnitChange={(unitId) => handleUnitChange(item, unitId)}
                loadingSlots={loadingSlot[slotKey] ?? false}
                slotError={slotError[slotKey] ?? null}
                onBooked={() => fetchSlots(item.facilityId, selectedDates[dateKey] ?? todayStr(), item.selectedUnitId)}
              >
                {item.bookingMode === 'class'
                  ? (() => {
                      const month = classMonth[dateKey] ?? currentMonthKey()
                      const key = monthKeyFor(item.facilityId, item.selectedUnitId, month)
                      return (
                        <ClassMonthPicker
                          facilityId={item.facilityId}
                          units={item.units}
                          selectedUnitId={item.selectedUnitId}
                          onUnitChange={(unitId) => handleUnitChange(item, unitId)}
                          month={month}
                          fees={fees}
                          onMonthChange={(m) => handleMonthChange(item, m)}
                          data={classData[key] ?? null}
                          loading={classLoading[key] ?? false}
                          error={classError[key] ?? null}
                          onRetry={() => fetchMonth(item.facilityId, item.selectedUnitId, month)}
                          onBooked={() => fetchMonth(item.facilityId, item.selectedUnitId, month)}
                        />
                      )
                    })()
                  : null}
              </BookingListItem>
            )
          })}
        </div>
      </div>
    </section>
  )
}
