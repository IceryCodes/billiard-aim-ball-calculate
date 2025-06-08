import { ReactNode } from 'react';

interface H3LiProps {
  label: string;
  value: ReactNode | null;
}

export const H3Li = ({ label, value }: H3LiProps): ReactNode => (
  <>
    {!!value && (
      <li>
        <h3>
          <div className="flex gap-x-2 items-center">
            <span className="whitespace-nowrap">{label}: </span>
            <span className="break-words">{value}</span>
          </div>
        </h3>
      </li>
    )}
  </>
);
