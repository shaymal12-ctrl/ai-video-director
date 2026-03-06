import './globals.css';

export const metadata = {
  title: 'AI Video Director',
  description: 'Generate cinematic shot lists from video ideas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
