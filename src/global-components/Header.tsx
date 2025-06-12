'use client';

import { ReactNode, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { getPageUrlByType, PageType, PageTypeMap } from '@/domains/interface';
import AdminProtected from '@/hooks/utils/protections/components/useAdminProtected';

import { Button } from './buttons/Button';
import VerifyBar from './VerifyBar';

const linkStyle = 'font-bold block transition-all duration-300 ease-in-out md:inline';

const Header = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const Logout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <>
      {/* Header Section */}
      <header className={`h-header w-full bg-background fixed top-0 z-20 shadow-md`}>
        <div className="container h-full p-4 m-auto flex justify-between items-center">
          {/* Logo */}
          <Link href={process.env.NEXT_PUBLIC_BASE_URL}>
            <Image
              src="/assets/logo.png"
              alt={`${process.env.NEXT_PUBLIC_SITENAME} Logo`}
              width={280}
              height={180}
              className="max-h-[30px] w-auto"
              placeholder="blur"
              blurDataURL="/assets/logo.png"
            />
          </Link>

          {/* Mobile Hamburger Icon */}
          <Button
            element={
              <svg
                className="w-6 h-6 md:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            }
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
          />

          {/* Navigation with Transition */}
          <nav
            className={`absolute md:static top-header left-0 w-full md:z-10 md:w-auto bg-background md:bg-transparent
            ${menuOpen ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 -translate-y-80 -z-10'} 
            md:opacity-100 md:translate-y-0 md:flex transition-all duration-300 ease-in-out`}
          >
            <ul className="flex flex-col md:flex-row gap-4 p-4 md:p-0">
              {Object.keys(PageTypeMap).map((key) => {
                const pageType = PageTypeMap[key];

                if (pageType === PageType.LOGIN || pageType === PageType.REGISTER) if (isAuthenticated) return;
                if (pageType === PageType.PROFILE && !isAuthenticated) return;
                if (pageType === PageType.HOME || pageType === PageType.VERIFY || pageType === PageType.ADMIN) return;

                return (
                  <Link key={key} href={`/${key.toLowerCase()}`} className={linkStyle} onClick={() => setMenuOpen(false)}>
                    <li>{pageType}</li>
                  </Link>
                );
              })}

              <AdminProtected>
                <Link href={getPageUrlByType(PageType.ADMIN)} className={linkStyle}>
                  <li>{PageType.ADMIN}</li>
                </Link>
              </AdminProtected>

              {isAuthenticated && (
                <Link href="" className={linkStyle} onClick={Logout}>
                  <li>登出</li>
                </Link>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Content Section */}
      <section className={`mt-header`}>{children}</section>

      <VerifyBar />
    </>
  );
};

export default Header;
