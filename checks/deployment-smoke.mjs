import assert from 'node:assert/strict';

const base = process.env.VERA_DEMO_URL;
assert.ok(base && /^https?:\/\//.test(base), 'Set VERA_DEMO_URL to the demo being verified');
for (const name of ['DEMO_ADMIN_PASSWORD', 'DEMO_CAREGIVER_PASSWORD', 'DEMO_SECOND_CAREGIVER_PASSWORD']) {
    assert.ok(process.env[name], `Missing ${name}`);
}
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; console.log(`PASS ${label}`); };
class Client {
    cookies = new Map();
    async send(path, method = 'GET', body, csrf = true) {
        if (csrf && method !== 'GET' && !this.cookies.has('XSRF-TOKEN')) await this.send('/api/auth/me');
        const headers = {Cookie: [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ')};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (csrf && method !== 'GET') headers['X-XSRF-TOKEN'] = this.cookies.get('XSRF-TOKEN');
        const response = await fetch(new URL(path, base), {method, headers, redirect: 'error',
            body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
        const setCookies = response.headers.getSetCookie();
        for (const cookie of setCookies) {
            const pair = cookie.split(';')[0], offset = pair.indexOf('=');
            const key = pair.slice(0, offset), value = pair.slice(offset + 1);
            if (/max-age=0/i.test(cookie)) this.cookies.delete(key);
            else this.cookies.set(key, value);
        }
        const text = await response.text();
        const json = response.headers.get('Content-Type')?.includes('json');
        return {status: response.status, headers: response.headers, setCookies, body: text && json ? JSON.parse(text) : text};
    }
    async login(email, password) {
        const result = await this.send('/api/auth/login', 'POST', {email, password});
        assert.equal(result.status, 200, `Sign-in failed for ${email}`);
        const session = result.setCookies.find(cookie => cookie.startsWith('JSESSIONID='));
        check(session && /;\s*Secure/i.test(session) && /;\s*HttpOnly/i.test(session) && /SameSite=Lax/i.test(session), 'session cookie is Secure, HttpOnly, and SameSite=Lax');
        await this.send('/api/auth/me');
        return result.body;
    }
}

const anonymous = new Client();
for (const path of ['/readyz', '/livez']) {
    const result = await anonymous.send(path);
    check(result.status === 200 && JSON.stringify(result.body) === '{"status":"UP"}', `${path} exposes only healthy status`);
}
for (const path of ['/', '/dashboard', '/my-visits', '/caregiver/visits/1', '/caregivers/1', '/patients/1']) {
    const result = await anonymous.send(path);
    check(result.status === 200 && typeof result.body === 'string' && result.body.includes('<div id="root">'), `frontend refresh works at ${path}`);
    check(/no-cache|no-store/.test(result.headers.get('Cache-Control')), 'HTML requires revalidation');
}
const html = (await anonymous.send('/')).body;
const asset = html.match(/src="([^"]+\.js)"/)?.[1];
assert.ok(asset, 'Compiled JavaScript is referenced by HTML');
check(/immutable/.test((await anonymous.send(asset)).headers.get('Cache-Control')), 'fingerprinted assets are immutable');
check((await anonymous.send('/assets/missing-acceptance.js')).status === 404, 'missing assets retain 404');
for (const path of ['/api/visits', '/api/unknown', '/actuator', '/actuator/health', '/actuator/env']) {
    const result = await anonymous.send(path);
    check(result.status === 401 && typeof result.body === 'object', `${path} never falls through to frontend HTML`);
}
const session = await anonymous.send('/api/auth/me');
const csrfCookie = session.setCookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
// An earlier read may already have created the token; request a fresh client for attributes.
const fresh = await new Client().send('/api/auth/me');
const tokenCookie = csrfCookie || fresh.setCookies.find(cookie => cookie.startsWith('XSRF-TOKEN='));
check(tokenCookie && /;\s*Secure/i.test(tokenCookie) && /SameSite=Lax/i.test(tokenCookie) && !/HttpOnly/i.test(tokenCookie), 'CSRF cookie is secure and readable by the frontend');

const admin = new Client(), admin2 = new Client(), a = new Client(), a2 = new Client(), b = new Client();
await admin.login('denise@agency.com', process.env.DEMO_ADMIN_PASSWORD);
await admin2.login('denise@agency.com', process.env.DEMO_ADMIN_PASSWORD);
const marcus = await a.login('marcus@agency.com', process.env.DEMO_CAREGIVER_PASSWORD);
await a2.login('marcus@agency.com', process.env.DEMO_CAREGIVER_PASSWORD);
const dana = await b.login('dana@agency.com', process.env.DEMO_SECOND_CAREGIVER_PASSWORD);
const all = await admin.send('/api/visits');
assert.equal(all.status, 200);
check(/no-store/.test(all.headers.get('Cache-Control')), 'authenticated API records are not cached');
const patientId = all.body[0].patientId;
for (const [client, user] of [[a, marcus], [b, dana]]) {
    const mine = await client.send('/api/visits/mine');
    check(mine.status === 200 && mine.body.length > 0 && mine.body.every(visit => visit.caregiverId === user.caregiverId), 'caregiver schedule is session-scoped');
    const forged = await client.send('/api/visits/mine?caregiverId=999999');
    assert.deepEqual(forged.body, mine.body);
    check((await client.send(`/api/caregivers/${user.caregiverId}`)).status === 200, 'own caregiver record is readable');
    for (const path of ['/api/visits', '/api/visits/counts', '/api/patients', '/api/caregivers']) {
        check((await client.send(path)).status === 403, 'office records reject caregiver role');
    }
}
const schedule = async caregiverId => {
    const result = await admin.send('/api/visits', 'POST', {patientId, caregiverId,
        appointmentTime: new Date(Date.now() + 3600000).toISOString(), serviceType: 'HOMEMAKER', estimatedCost: 40});
    assert.equal(result.status, 201, 'Administrator schedules acceptance visit');
    return result.body;
};
const visit = await schedule(marcus.caregiverId);
for (const suffix of ['check-in', 'check-out', 'evidence']) {
    check((await admin.send(`/api/visits/${visit.id}/${suffix}`, 'POST', {})).status === 403, 'administrator cannot produce caregiver evidence');
    const foreign = await b.send(`/api/visits/${visit.id}/${suffix}`, 'POST', {});
    check(foreign.status === 404 && foreign.body.message === 'Record not found', 'foreign visit writes are generic 404');
}
const before = (await admin.send(`/api/visits/${visit.id}`)).body;
check((await a.send(`/api/visits/${visit.id}/check-in`, 'POST', {}, false)).status === 403, 'CSRF is mandatory for owned writes');
assert.deepEqual((await admin.send(`/api/visits/${visit.id}`)).body, before);
const missing = await b.send('/api/visits/9223372036854775807');
const foreign = await b.send(`/api/visits/${visit.id}`);
check(missing.status === 404 && foreign.status === 404 && JSON.stringify(missing.body) === JSON.stringify(foreign.body), 'missing and inaccessible records have identical responses');
const race = await Promise.all([a.send(`/api/visits/${visit.id}/check-in`, 'POST', {available: false, reason: 'denied'}),
    a2.send(`/api/visits/${visit.id}/check-in`, 'POST', {available: false, reason: 'denied'})]);
check(race.map(result => result.status).sort().join(',') === '200,409', 'concurrent check-ins produce one transition');
const checkout = await a.send(`/api/visits/${visit.id}/check-out`, 'POST', {assessment: 'Acceptance care delivered', signature: ''});
check(checkout.status === 200 && checkout.body.status === 'NEEDS_REVIEW', 'missing signature holds checkout for review');
const evidence = await a.send(`/api/visits/${visit.id}/evidence`, 'POST', {signature: 'Fictional Acceptance Patient'});
check(evidence.status === 200 && evidence.body.status === 'READY_TO_BILL' && evidence.body.assessment === 'Acceptance care delivered', 'evidence completes visit without erasing assessment');
check((await a.send(`/api/visits/${visit.id}/claim`, 'POST')).status === 403, 'caregiver cannot submit a claim');
const claims = await Promise.all([admin.send(`/api/visits/${visit.id}/claim`, 'POST'), admin2.send(`/api/visits/${visit.id}/claim`, 'POST')]);
check(claims.map(result => result.status).sort().join(',') === '200,409', 'concurrent claims create one billed result');
for (const [client, user, other] of [[a, marcus, dana], [b, dana, marcus]]) {
    const record = (await client.send(`/api/caregivers/${user.caregiverId}`)).body;
    const pending = record.documents.find(document => document.signature === null && document.fileName === null);
    assert.ok(pending, 'Reset the demo before acceptance: a pending signature is needed');
    const path = `/api/caregivers/${user.caregiverId}/documents/${pending.id}`;
    check((await admin.send(`${path}/signature`, 'POST', {signature: 'Fictional Caregiver'})).status === 403, 'administrator cannot sign caregiver document');
    const signed = await client.send(`${path}/signature`, 'POST', {signature: 'Fictional Caregiver'});
    check(signed.status === 200 && signed.body.documents.find(document => document.id === pending.id).signature === 'Fictional Caregiver', 'caregiver signs own pending document');
    const snapshot = (await admin.send(`/api/caregivers/${user.caregiverId}`)).body;
    const otherClient = other.caregiverId === marcus.caregiverId ? a : b;
    for (const suffix of ['signature', 'submission']) {
        check((await otherClient.send(`${path}/${suffix}`, 'POST', {signature: 'forged', fileName: 'forged.pdf'})).status === 404, 'foreign document mutation is hidden');
    }
    assert.deepEqual((await admin.send(`/api/caregivers/${user.caregiverId}`)).body, snapshot);
    const renewal = record.documents.find(document => document.fileName !== null);
    assert.ok(renewal);
    const renewalPath = `/api/caregivers/${user.caregiverId}/documents/${renewal.id}/submission`;
    check((await client.send(renewalPath, 'POST', {fileName: 'fictional-renewal.pdf', fileSize: 123, fileType: 'application/pdf',
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()})).status === 200, 'caregiver submits renewal metadata');
    check((await client.send(`${renewalPath}/acceptance`, 'POST')).status === 403, 'caregiver cannot accept own renewal');
    const accepted = await admin.send(`${renewalPath}/acceptance`, 'POST');
    check(accepted.status === 200 && accepted.body.documents.find(document => document.id === renewal.id).fileName === 'fictional-renewal.pdf', 'administrator accepts renewal');
}
const cancellable = await schedule(marcus.caregiverId);
const cancelRace = await Promise.all([a.send(`/api/visits/${cancellable.id}/check-in`, 'POST', {}), admin.send(`/api/visits/${cancellable.id}`, 'DELETE')]);
check(cancelRace.map(result => result.status).sort().join(',') === '200,409', 'cancellation and check-in serialize');
const movable = await schedule(marcus.caregiverId);
const assignmentRace = await Promise.all([a.send(`/api/visits/${movable.id}/check-in`, 'POST', {}), admin.send(`/api/visits/${movable.id}`, 'PUT',
    {caregiverId: dana.caregiverId, appointmentTime: movable.appointmentTime})]);
check((assignmentRace[0].status === 200 && assignmentRace[1].status === 409) ||
    (assignmentRace[0].status === 404 && assignmentRace[1].status === 200), 'reassignment and check-in serialize ownership');
for (const client of [admin, admin2, a, a2, b]) {
    check((await client.send('/api/auth/logout', 'POST')).status === 204 && (await client.send('/api/auth/me')).status === 204, 'logout ends the session');
}
console.log(`${checks} deployment checks passed. Reset the demo before sharing it.`);
