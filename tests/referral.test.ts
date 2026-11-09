import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/db';
import { PrismaStorage } from '../server/storage';

test('each referred appointment increments counters by one, rather than doubling the total', async () => {
  const original = { create: db.appointment.create, findUnique: db.referral.findUnique, update: db.referral.update };
  let stats: any;
  (db.appointment as any).create = async ({data}: any) => ({...data,id:10});
  (db.referral as any).findUnique = async () => ({id:1,totalReferred:4,discountsEarned:4});
  (db.referral as any).update = async ({data}: any) => { stats=data;return {id:1}; };
  try {
    await new PrismaStorage().createAppointment({clientName:'Teste',clientPhone:'83999991234',service:'suite-padrao',date:'2099-11-07',time:'09:00',duration:60,status:'agendado',referredBy:'FRIEND',referralCode:'OWN'});
    assert.deepEqual(stats,{totalReferred:{increment:1},discountsEarned:{increment:1}});
  } finally {
    db.appointment.create=original.create;
    db.referral.findUnique=original.findUnique;
    db.referral.update=original.update;
  }
});
