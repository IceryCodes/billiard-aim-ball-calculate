import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className }: CardProps): ReactNode => (
  <div className={`rounded-xl bg-backgroundLight p-6 flex flex-col gap-y-2${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);

export default Card;
