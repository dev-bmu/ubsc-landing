// ===== Bentuk yang dikembalikan GET /api/public/booking/month =====
// Port dari UBSC-LARAVEL/resources/js/Components/Booking/Class/types.ts.
//
// Nama tipenya DIPERTAHANKAN (ClassSession, ClassDay, ClassPattern, ClassMonthSummary,
// ClassMonthData, SessionKey) supaya komponen dan halaman yang mengonsumsinya tetap membaca sama
// seperti di Laravel. Yang berubah hanya isinya: bentuk resmi respons ada di
// '@/types/contracts/contracts' (MonthDto dan kawan-kawan) dengan field camelCase
// (start_time→startTime, already_booked→alreadyBooked, dst) dan id uuid string. Menulis ulang
// interface-nya di sini = dua sumber kebenaran yang diam-diam melenceng, jadi file ini hanya alias.
import type { MonthDayDto, MonthDto, MonthPatternDto, MonthSessionDto, MonthSummaryDto, SessionStatus } from '@/types/contracts/contracts'

export type { SessionStatus }

export type ClassSession = MonthSessionDto

export type ClassDay = MonthDayDto

/** Satu jadwal rutin weekday+jam, mis. "Rabu · 12:00 · 4 sesi". */
export type ClassPattern = MonthPatternDto

export type ClassMonthSummary = MonthSummaryDto

export type ClassMonthData = MonthDto

/** `${date}|${startTime}` — stabil lintas refetch. */
export type SessionKey = string

export const sessionKey = (session: Pick<ClassSession, 'date' | 'startTime'>): SessionKey => `${session.date}|${session.startTime}`
