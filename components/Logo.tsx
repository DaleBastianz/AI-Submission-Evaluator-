'use client';

import Image from 'next/image';
import { useTheme } from './Providers';

export default function Logo() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <span
      className="inline-flex items-center rounded-lg px-1 py-0.5"
      style={{ backgroundColor: isLight ? '#ffffff' : '#000000' }}
    >
      <Image
        src={isLight ? '/logo-light.png' : '/logo-dark.png'}
        alt="EduAI — Learn Smarter"
        width={168}
        height={52}
        className="h-9 w-auto object-contain sm:h-10"
        priority
      />
    </span>
  );
}
