import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  value: string;
  language?: string;
  height?: string;
  className?: string;
  readOnly?: boolean;
}

export function CodeBlock({
  value,
  language = 'typescript',
  height = '200px',
  className,
  readOnly = true,
}: CodeBlockProps) {
  return (
    <div className={cn('rounded-md border overflow-hidden bg-[#1e1e1e]', className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
          },
        }}
      />
    </div>
  );
}

export default CodeBlock;
