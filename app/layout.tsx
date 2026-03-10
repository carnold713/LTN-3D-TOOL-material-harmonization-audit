import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Material Harmonization Audit",
  description: "AI-powered material comparison and harmonization audit tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MH</span>
              </div>
              <span className="font-bold text-xl tracking-tight">
                MaterialAudit
              </span>
            </a>
            <div className="flex items-center gap-8">
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Home
              </a>
              <a
                href="/audit"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Start Audit
              </a>
              <a
                href="/admin"
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Admin
              </a>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">MH</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                MaterialAudit
              </span>
            </div>
            <p className="text-xs text-gray-400 text-center">
              <strong>Disclaimer:</strong> AI-powered analysis. Results are
              preliminary. Verify with your Lutron representative.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
