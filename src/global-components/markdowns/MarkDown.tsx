import { ReactNode } from 'react';

import Image from 'next/image';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkDownProps {
  content: string;
}

interface CustomImageProps {
  src?: string;
  alt?: string;
  title?: string;
}

interface HeadingProps {
  children?: ReactNode;
  className?: string;
}

interface LinkProps {
  href?: string;
  children?: ReactNode;
  className?: string;
}

interface ParagraphProps {
  children?: ReactNode;
  className?: string;
}

export const MarkDown = ({ content }: MarkDownProps): JSX.Element => {
  const CustomImage = ({ src, alt, title }: CustomImageProps): JSX.Element => (
    <span className="block my-4 text-center">
      <span className="inline-block hover:scale-105 transition-all duration-300 max-w-xs">
        <Image src={src || ''} alt={alt || ''} width={720} height={480} className="rounded-lg" />
      </span>
      {title && <span className="block text-sm text-gray-600 mt-2">{title}</span>}
    </span>
  );

  const components: Partial<Components> = {
    img: CustomImage,

    a: ({ href, children, ...props }: LinkProps) => {
      const isExternal = href?.startsWith('http') || href?.startsWith('https');
      return (
        <a
          href={href}
          className="text-link hover:opacity-80 transition-opacity duration-300"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },

    h1: ({ children, ...props }: HeadingProps) => (
      <h1 {...props} className="text-2xl font-bold mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: HeadingProps) => (
      <h2 {...props} className="text-xl font-bold mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: HeadingProps) => (
      <h3 {...props} className="text-lg font-bold mt-4 mb-2">
        {children}
      </h3>
    ),

    p: ({ children, className }: ParagraphProps): JSX.Element => (
      <p className={`text-justify my-4 ${className || ''}`}>{children}</p>
    ),

    ol: ({ children, className }: HeadingProps) => (
      <ol className={`list-decimal list-inside text-justify tracking-wider my-4 pl-4 ${className || ''}`}>{children}</ol>
    ),
    ul: ({ children, className }: HeadingProps) => (
      <ul className={`list-disc list-inside text-justify tracking-wider my-4 pl-4 ${className || ''}`}>{children}</ul>
    ),

    blockquote: ({ children, className }: HeadingProps) => (
      <blockquote className={`border-l-4 border-link pl-4 py-2 my-4 bg-backgroundLight/20 ${className || ''}`}>
        {children}
      </blockquote>
    ),

    code: ({ children, className }: HeadingProps) => (
      <code className={`bg-backgroundLight/20 px-2 py-1 rounded text-sm ${className || ''}`}>{children}</code>
    ),
  };

  return (
    <article
      className="prose prose-base dark:prose-invert max-w-none
                 prose-headings:font-noto prose-headings:font-light prose-headings:tracking-wider
                 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                 prose-p:font-noto prose-p:font-light prose-p:tracking-wider
                 prose-li:font-noto prose-li:font-light prose-li:tracking-wider
                 prose-a:text-link hover:prose-a:opacity-80
                 prose-strong:font-medium
                 prose-blockquote:border-link prose-blockquote:bg-backgroundLight/20
                 prose-img:rounded-lg
                 prose-pre:bg-backgroundLight/20
                 prose-code:text-sm prose-code:bg-backgroundLight/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                 transition-colors duration-1000"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
};

MarkDown.displayName = 'MarkDown';
