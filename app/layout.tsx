import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Extempore Companion for Parents and Students',
  description: 'A bilingual website for Indian parents and students to prepare class-wise extempore content in Hindi or English with word meanings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="site-body">
        <div className="dashboard-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
