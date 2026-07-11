import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose prose-invert max-w-none text-sm leading-relaxed text-slate-300', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2" {...props} />,
          h2: (props) => <h2 className="text-lg font-bold text-foreground mt-3 mb-1.5" {...props} />,
          h3: (props) => <h3 className="text-md font-semibold text-foreground mt-2 mb-1" {...props} />,
          p: (props) => <p className="mb-3 text-slate-300" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
          li: (props) => <li className="text-slate-300" {...props} />,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-red-400 font-mono text-xs" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-black/40 border p-3 rounded-md overflow-x-auto my-3">
                <code className={cn('text-xs font-mono text-slate-200 block', className)} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: (props) => <table className="w-full border-collapse border my-3 text-xs" {...props} />,
          th: (props) => <th className="border p-2 bg-muted font-semibold text-left" {...props} />,
          td: (props) => <td className="border p-2" {...props} />,
          blockquote: (props) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3" {...props} />
          ),
          a: (props) => (
            <a className="text-primary hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
