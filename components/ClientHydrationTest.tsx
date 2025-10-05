"use client";

export default function ClientHydrationTest() {
  return (
    <button
      onClick={() => alert("client click works")}
      className="px-3 py-2 rounded border"
    >
      Test Click
    </button>
  );
}
