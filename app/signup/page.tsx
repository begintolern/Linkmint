'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');              // YYYY-MM-DD
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, dob, ageConfirm }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        if (res.status === 409) setError('That email is already in use.');
        else if (res.status === 403 && data?.error === 'must_be_18_or_older') {
          setError('You must be at least 18 years old to sign up.');
        } else if (res.status === 400 && data?.error === 'invalid_dob') {
          setError('Please enter a valid date of birth.');
        } else if (res.status === 400) {
          setError('Please fill in all fields.');
        } else {
          setError('Signup failed. Please try again.');
        }
        return;
      }

      router.push('/verify-email');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Create account</h1>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            required
          />
          <p className="mt-1 text-xs text-gray-500">You must be at least 18 years old.</p>
        </div>

        {/* 18+ Confirmation */}
        <div className="flex items-start gap-2">
          <input
            id="ageConfirm"
            type="checkbox"
            checked={ageConfirm}
            onChange={(e) => setAgeConfirm(e.currentTarget.checked)}
            required
            className="mt-1"
          />
          <label htmlFor="ageConfirm" className="text-sm text-slate-700">
            I confirm that I am 18 years or older and agree to the{' '}
            <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms</a>{' '}
            and{' '}
            <a className="underline" href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account? <a className="underline" href="/login">Sign in</a>
      </p>
    </main>
  );
}
