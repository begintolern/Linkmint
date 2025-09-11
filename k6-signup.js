import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  vus: 20,                 // 20 virtual users
  duration: '30s',         // run for 30 seconds
  gracefulStop: '0s',      // stop immediately at end
  thresholds: {
    signup_created_201: ['count>=10'],  // expect at least some signups
    signup_capped_403:  ['count>=0'],   // may be 0 if cap is high
    http_req_duration:  ['p(95)<800'],  // p95 should be <800ms
  },
};

const created201 = new Counter('signup_created_201');
const capped403  = new Counter('signup_capped_403');
const otherErr   = new Counter('signup_other_error');

function randEmail() {
  return `u_${uuidv4().slice(0, 12)}@example.test`;
}

export default function () {
  const payload = JSON.stringify({
    email: randEmail(),
    password: 'P@ssw0rd!123',
    name: 'Load Test',
    dob: '1990-01-01',
    ageConfirm: true,
  });

  // 👇 make sure port matches your running app (3001 in your case)
  const url = 'http://host.docker.internal:3001/api/signup';

  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '60s',
  });

  if (res.status === 201) created201.add(1);
  else if (res.status === 403) capped403.add(1);
  else otherErr.add(1);

  check(res, {
    '201 or 403': (r) => r.status === 201 || r.status === 403,
  });

  sleep(1); // slower, more realistic pacing
}
