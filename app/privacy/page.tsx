export default function PrivacyPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-teal-700">Privacy Policy</h1>
      <p className="text-gray-700 mb-4">
        Linkmint only collects the data necessary to run the platform — like your email, referral links, and earnings.
      </p>
      <p className="text-gray-700 mb-4">
        We do not sell your data. We do not share your personal information with anyone outside of essential payment or email systems.
      </p>
      <p className="text-gray-700">
        You can contact us at <a href="mailto:admin@linkmint.co" className="underline">admin@linkmint.co</a> to request data removal at any time.
      </p>
    </div>
  );
}
