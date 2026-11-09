import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingSchema, bookingTimes, calendarDateKey, clinicNow, parseCalendarDate } from '../shared/booking';

const valid = { clientName: 'Cliente Teste', clientPhone: '(83) 99999-1234', service: 'suite-padrao', date: '2099-11-07', time: '09:00', duration: 60 };

test('normalizes formatted phones and rejects empty/invalid values', () => {
  assert.equal(bookingSchema.parse(valid).clientPhone, '83999991234');
  for (const phone of ['', '123', 'abcdefghijk', '83 99999-12345']) {
    assert.equal(bookingSchema.safeParse({ ...valid, clientPhone: phone }).success, false);
  }
});

test('validates calendar dates, service, duration and future bookings', () => {
  for (const patch of [{ date: '2099-02-30' }, { date: '2000-01-01' }, { service: '' }, { duration: -1 }, { clientName: '   ' }]) {
    assert.equal(bookingSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(parseCalendarDate('2024-02-29')?.getDate(), 29);
  assert.equal(parseCalendarDate('2025-02-29'), undefined);
});

test('weekend and weekday schedules do not drift with UTC date parsing', () => {
  assert.equal(bookingTimes('2026-11-07').includes('08:30'), false); // Saturday
  assert.equal(bookingTimes('2026-11-08').includes('21:00'), false); // Sunday
  assert.equal(bookingTimes('2026-11-09').includes('08:30'), true); // Monday
  assert.equal(bookingTimes('bad-date').length, 0);
  assert.equal(calendarDateKey(parseCalendarDate('2026-11-07')!), '2026-11-07');
  assert.deepEqual(clinicNow(new Date('2026-11-09T01:30:00Z')), { date: '2026-11-08', time: '22:30' });
  assert.equal(bookingSchema.safeParse({ ...valid, date: '2099-11-07', time: '03:00' }).success, false);
});
