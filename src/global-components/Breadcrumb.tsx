'use client';

import { Fragment, ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PageTypeMap } from '@/domains/interface';

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb = ({ pageName }: BreadcrumbProps): ReactNode => {
  const pathname = usePathname();

  if (!pathname || pathname === '/') return <></>;

  const pathSegments = pathname.split('/').filter((segment) => segment);

  const convertLabel = (text: string): string => {
    return PageTypeMap[text.toUpperCase()] || text;
  };

  return (
    <nav>
      <ul className="flex gap-x-2">
        <Link href={process.env.NEXT_PUBLIC_BASE_URL} className="hover:text-link">
          <li className="hover:text-link">{process.env.NEXT_PUBLIC_SITENAME}</li>
        </Link>
        <span>/</span>

        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;

          return (
            <Fragment key={path}>
              <Link href={path} className="hover:text-link">
                <li className={`hover:text-link ${isLast ? 'text-link' : ''}`}>
                  {isLast ? pageName : convertLabel(segment.replace(/-/g, ' '))}
                </li>
              </Link>
              {!isLast && <span>/</span>}
            </Fragment>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
