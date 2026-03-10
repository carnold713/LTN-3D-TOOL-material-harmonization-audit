export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            High-Fidelity Material
            <br />
            <span className="text-gray-300">Comparison Analysis</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl">
            AI-powered surface audit system for architectural hardware. Upload
            your material sample and compare it against reference standards with
            precision scoring.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <a
              href="/audit"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Start New Audit
            </a>
            <a
              href="/admin"
              className="inline-flex items-center px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Admin Panel
            </a>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Upload Sample</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Select a reference material and upload your sample image for
              intelligent comparison.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Advanced AI evaluates finish, color, and material properties with
              detailed 0-10 scoring.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Actionable Feedback</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Receive pass/fail results with specific improvement suggestions
              for each category.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              How It Works
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Three Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-black text-white rounded-2xl flex items-center justify-center text-lg font-bold mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900">Choose Reference</h3>
              <p className="mt-2 text-sm text-gray-500">
                Select the reference standard material you want to match.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-black text-white rounded-2xl flex items-center justify-center text-lg font-bold mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900">Upload Sample</h3>
              <p className="mt-2 text-sm text-gray-500">
                Take a photo of your material and upload it for analysis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-black text-white rounded-2xl flex items-center justify-center text-lg font-bold mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900">Get Results</h3>
              <p className="mt-2 text-sm text-gray-500">
                Receive detailed scoring and comparison with actionable feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> This tool uses artificial intelligence
            for material analysis. All results are preliminary assessments and
            should be verified with your Lutron representative before making any
            production decisions.
          </p>
        </div>
      </section>
    </div>
  );
}
