"use client";
export const dynamic = "force-dynamic";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 2000);
        }
      } catch (err) {
        console.error("Verification failed:", err);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Email Verified ✅</h1>
        <p className="text-gray-600 mb-2">You will be redirected to login shortly...</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Verifying token...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
