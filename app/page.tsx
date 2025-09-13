// app/page.tsx
"use client";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-b from-white to-gray-50">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
          Welcome to <span className="text-teal-600">Linkmint</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mb-8">
          Share smart links. Earn commissions. Grow with confidence.
        </p>

        {/* Tutorial Video */}
        <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-lg border">
          <video
            controls
            poster="/video/tutorial-poster.jpg"
            className="w-full h-auto"
          >
            <source src="/video/tutorial.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <h2 className="text-3xl font-semibold text-center mb-10">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 border rounded-xl shadow-sm text-center">
            <h3 className="text-xl font-semibold mb-2">1. Create</h3>
            <p className="text-gray-600">
              Generate smart links in seconds from top merchants.
            </p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm text-center">
            <h3 className="text-xl font-semibold mb-2">2. Share</h3>
            <p className="text-gray-600">
              Post your links anywhere: social, blogs, or messages.
            </p>
          </div>
          <div className="p-6 border rounded-xl shadow-sm text-center">
            <h3 className="text-xl font-semibold mb-2">3. Earn</h3>
            <p className="text-gray-600">
              Get paid commissions after verified purchases.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-teal-600 text-white text-center">
        <h2 className="text-3xl font-semibold mb-6">
          Ready to start earning?
        </h2>
        <a
          href="/signup"
          className="bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Join Now
        </a>
      </section>
    </main>
  );
}
