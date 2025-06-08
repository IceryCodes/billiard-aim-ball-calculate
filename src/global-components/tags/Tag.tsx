import { ReactNode } from 'react';

interface TagProps {
  text: string;
  onClick?: () => void;
}

const Tag = ({ text, onClick }: TagProps): ReactNode => (
  <span className="bg-link text-background text-sm px-2 py-1 rounded" onClick={onClick}>
    {text}
  </span>
);

export default Tag;
