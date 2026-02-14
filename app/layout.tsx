// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="wrapper-gradient min-h-screen relative font-inter text-white overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 md:px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
