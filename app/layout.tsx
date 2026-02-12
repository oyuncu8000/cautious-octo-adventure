import './globals.css'

export const metadata = {
  title: 'Social App',
  description: 'Modern sosyal medya uygulaması',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  )
}