export default function CheckEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow rounded p-6 text-center max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
        <p className="text-gray-600">
          We’ve sent a verification link to your inbox. Open the email and click
          the link to verify your account. If you don’t see it, check Spam/Promotions.
        </p>
      </div>
    </main>
  );
}
