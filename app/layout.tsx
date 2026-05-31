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
    <html lang="en" className="dark">
      <body className="bg-[#080b10] text-white dark:bg-[#080b10] dark:text-white light:bg-white light:text-gray-900">
        <Providers>
          <AppNavBar />
          <div className="pt-[4.25rem]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
