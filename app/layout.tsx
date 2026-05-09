import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Virtual Analyst - Ecommerce Analytics Dashboard',
  description: 'AI-powered analytics dashboard for measuring user performance from organic search and paid ads',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
