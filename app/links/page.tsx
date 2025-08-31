export default function LinksPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Your Links</h1>
      <p className="text-sm text-gray-600">
        Create and manage your smart links. Keep the dashboard clean — all link details live here.
      </p>

      {/* TODO: Add create form + history table */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-gray-700">
          Link tools coming next: paste a product URL → generate a smart link → copy & share.
        </p>
      </div>
    </div>
  );
}
