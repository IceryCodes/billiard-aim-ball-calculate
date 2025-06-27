import { JSX, useMemo } from 'react';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  maxButtons?: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ totalPages, currentPage, maxButtons = 5, onPageChange }: PaginationProps): JSX.Element => {
  const pageButtons = useMemo((): (number | null)[] => {
    const pages: (number | null)[] = [];

    if (totalPages < 1) return pages;

    pages.push(1);

    const halfMax = Math.floor(maxButtons / 2);
    let startPage = Math.max(2, currentPage - halfMax);
    let endPage = Math.min(totalPages - 1, currentPage + halfMax);

    if (endPage - startPage < maxButtons - 2) {
      if (startPage === 2) {
        endPage = Math.min(startPage + (maxButtons - 2), totalPages - 1);
      } else if (endPage === totalPages - 1) {
        startPage = Math.max(2, endPage - (maxButtons - 2));
      }
    }

    if (startPage > 2) pages.push(null);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages - 1) pages.push(null);
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  }, [totalPages, currentPage, maxButtons]);

  if (totalPages <= 1) return <></>;

  const baseButtonClass = 'text-sm font-medium';

  return (
    <div className="flex items-center justify-center my-4 px-2 gap-x-2 whitespace-nowrap">
      <Button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        buttonStyle={currentPage === 1 ? ButtonStyleType.Disabled : ButtonStyleType.Active}
        className={baseButtonClass}
        text="前一頁"
      />

      <div className="overflow-x-auto whitespace-nowrap p-2">
        <div className="inline-flex gap-x-2">
          {pageButtons.map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={index}
                onClick={() => onPageChange(page)}
                buttonStyle={currentPage === page ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                className={baseButtonClass}
                text={page.toString()}
              />
            ) : (
              <span key={index} className="px-4 py-2">
                ...
              </span>
            )
          )}
        </div>
      </div>

      <Button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        buttonStyle={currentPage === totalPages ? ButtonStyleType.Disabled : ButtonStyleType.Active}
        className={baseButtonClass}
        text="下一頁"
      />
    </div>
  );
};

export default Pagination;
