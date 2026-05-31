import type { Metadata } from 'next';
import './globals.css';
import AppNavBar from '../components/AppNavBar';
import { Providers } from '../components/Providers';

export const metadata: Metadata = {
  title: 'EduAI — AI-Powered Learning Management System',
  description: 'EduAI is a student-centric LMS with AI tutor, exam coach, content hub, and study tools.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-edu-page text-edu-text antialiased">
        <Providers>
          <AppNavBar />
          <div className="pt-[4.5rem]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
