import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kendronics | PCB Ordering And Logistics For Africa',
  description:
    'France-based PCB ordering, payments, and logistics platform for African engineers, students, and startups using trusted external manufacturing partners.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
