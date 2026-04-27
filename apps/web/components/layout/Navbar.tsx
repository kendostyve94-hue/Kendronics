'use client';

import { useEffect, useRef, useState } from 'react';
import { officialContactEmail } from '../../lib/official-contact';
import { Button } from '../ui/Button';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/how-it-works' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/capabilities' },
  { label: 'Pages', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Shop', href: '/quote' },
  { label: 'Contact Us', href: '/contact' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 8) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 text-white transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="border-b border-white/15 bg-[#07324a]/80 px-4 py-2 text-[11px] font-medium backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/90">
            <a href="tel:+18004567890">+1800 456 7890</a>
            <a href={`mailto:${officialContactEmail}`}>{officialContactEmail}</a>
            <span>5G, suite 798, Dakar / Paris</span>
          </div>
          <div className="hidden items-center gap-4 font-black sm:flex">
            <a href="/contact" aria-label="Facebook">f</a>
            <a href="/contact" aria-label="Twitter">t</a>
            <a href="/contact" aria-label="Google">G+</a>
            <a href="/contact" aria-label="LinkedIn">in</a>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 bg-[#07324a]/72 px-4 py-5 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between">
          <a href="/" className="inline-flex items-center gap-3 text-2xl font-black tracking-tight" aria-label="Kendronics home">
            <span className="grid h-10 w-10 place-items-center border-2 border-[#ffd22e] text-[10px] font-black leading-none text-[#ffd22e]">
              PCB
            </span>
            <span>
              <span className="text-[#ffd22e]">K</span>endronics
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-xs font-bold lg:flex">
            {navItems.map((item, index) => (
              <a key={item.href} href={item.href} className={index === 0 ? 'text-[#ffd22e]' : 'text-white transition hover:text-[#ffd22e]'}>
                {item.label}
              </a>
            ))}
            <span className="h-5 w-px bg-white/35" />
            <a href="/tracking" className="text-lg leading-none transition hover:text-[#ffd22e]" aria-label="Search">
              ?
            </a>
          </nav>

          <div className="flex items-center gap-3 lg:hidden">
            <Button href="/quote" className="hidden h-10 px-5 text-xs sm:inline-flex">
              Get Quote
            </Button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center border border-white/25 bg-white/10 text-white backdrop-blur transition hover:border-[#ffd22e]"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className="flex w-5 flex-col gap-1.5">
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`h-0.5 bg-current transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <nav id="mobile-navigation" className="mx-auto mt-5 grid max-w-[1180px] gap-2 border-t border-white/15 pt-4 lg:hidden">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center border border-white/15 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#ffd22e] hover:text-[#ffd22e]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
