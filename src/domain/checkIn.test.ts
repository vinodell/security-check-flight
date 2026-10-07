import { describe, expect, it } from 'vitest'
import {
  EXPECTED_BOOKING,
  INITIAL_CHECK_IN_DATA,
  STEP_FIELDS,
  matchesBooking,
  validateStep,
  type CheckInData,
  type CheckInStep,
} from './checkIn'

describe('single-booking check-in', () => {
  it('accepts the configured booking and validates each completed block', () => {
    expect(matchesBooking(EXPECTED_BOOKING)).toBe(true)
    for (const step of Object.keys(STEP_FIELDS) as CheckInStep[]) {
      expect(validateStep(step, EXPECTED_BOOKING)).toEqual({})
    }
  })

  it('normalizes letter case, surrounding whitespace, Ё and flight spacing', () => {
    const data: CheckInData = {
      ...EXPECTED_BOOKING,
      lastName: '  волкова  ',
      firstName: '\tАННА\n',
      middleName: 'сёргёёвна',
      flightNumber: ' aE\t2 0 4 ',
      bookingCode: ' sky204 ',
    }
    expect(matchesBooking(data)).toBe(true)
  })

  it('validates one block independently of the unfinished blocks', () => {
    const data: CheckInData = {
      ...INITIAL_CHECK_IN_DATA,
      lastName: EXPECTED_BOOKING.lastName,
      firstName: EXPECTED_BOOKING.firstName,
      middleName: EXPECTED_BOOKING.middleName,
      birthDate: EXPECTED_BOOKING.birthDate,
    }
    expect(validateStep('passenger', data)).toEqual({})
    expect(matchesBooking(data)).toBe(false)
    expect(Object.keys(validateStep('flight', data))).toEqual(STEP_FIELDS.flight)
  })

  it('rejects a mismatch in every individual field', () => {
    const alternatives: CheckInData = {
      lastName: 'Иванова',
      firstName: 'Мария',
      middleName: 'Андреевна',
      birthDate: '1998-04-13',
      flightNumber: 'AE 205',
      bookingCode: 'SKY205',
      departureDate: '2026-10-25',
      passportLastFour: '4822',
    }
    for (const field of Object.keys(alternatives) as (keyof CheckInData)[]) {
      const data = { ...EXPECTED_BOOKING, [field]: alternatives[field] }
      expect(matchesBooking(data), field).toBe(false)
    }
  })

  it('requires all passenger fields, including the middle name', () => {
    const errors = validateStep('passenger', INITIAL_CHECK_IN_DATA)
    expect(Object.keys(errors)).toEqual(STEP_FIELDS.passenger)
    expect(errors.middleName).toBe('Введите отчество')
  })

  it('rejects embedded spaces in the booking reference', () => {
    const data = { ...EXPECTED_BOOKING, bookingCode: 'SKY 204' }
    expect(validateStep('flight', data).bookingCode).toContain('без пробелов')
    expect(matchesBooking(data)).toBe(false)
  })

  it('keeps passport digits as a string and rejects malformed or zero-prefixed alternatives', () => {
    for (const passportLastFour of ['04821', '0482', '482', '48 21', '48A1']) {
      const data = { ...EXPECTED_BOOKING, passportLastFour }
      expect(validateStep('document', data).passportLastFour).toBeDefined()
      expect(matchesBooking(data)).toBe(false)
    }
  })

  it('rejects malformed and nonexistent dates before comparing the booking', () => {
    for (const birthDate of ['12.04.1998', '1998-4-12', '2026-02-29', '2026-02-30', '1998-13-12']) {
      expect(validateStep('passenger', { ...EXPECTED_BOOKING, birthDate }).birthDate)
        .toBe('Укажите корректную дату')
    }
    expect(validateStep('flight', { ...EXPECTED_BOOKING, departureDate: '2026-10-32' }).departureDate)
      .toBe('Укажите корректную дату')
  })
})
