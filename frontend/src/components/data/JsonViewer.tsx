import * as React from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface JsonViewerProps {
  data: Record<string, any> | Array<any>;
  expandedDepth?: number;
  className?: string;
}

export function JsonViewer({ data, expandedDepth = 2, className }: JsonViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const renderValue = (value: any, key: string | number, depth: number, path: string): React.ReactNode => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;

    if (typeof value === 'object') {
      return (
        <JsonNode
          name={key}
          value={value}
          depth={depth + 1}
          expandedDepth={expandedDepth}
          searchQuery={searchQuery}
          path={path}
        />
      );
    }

    if (typeof value === 'string') {
      const isMatch = searchQuery && value.toLowerCase().includes(searchQuery.toLowerCase());
      return (
        <span className={cn('text-green-400 font-mono break-all', isMatch && 'bg-yellow-500/20 text-yellow-200')}>
          "{value}"
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-400 font-mono">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-400 font-mono">{value ? 'true' : 'false'}</span>;
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className={cn('flex flex-col gap-3 p-4 rounded-md border bg-black/30 text-slate-200', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search JSON keys or values..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 text-xs h-8 bg-black/20"
        />
      </div>
      <div className="overflow-auto max-h-[400px] text-xs font-mono select-text">
        {renderValue(data, 'root', 0, 'root')}
      </div>
    </div>
  );
}

interface JsonNodeProps {
  name: string | number;
  value: Record<string, any> | Array<any>;
  depth: number;
  expandedDepth: number;
  searchQuery: string;
  path: string;
}

function JsonNode({ name, value, depth, expandedDepth, searchQuery, path }: JsonNodeProps) {
  const [isOpen, setIsOpen] = React.useState(depth <= expandedDepth);
  const isArray = Array.isArray(value);
  const keys = Object.keys(value);

  React.useEffect(() => {
    if (searchQuery) {
      setIsOpen(true);
    }
  }, [searchQuery]);

  const hasSearchMatches = React.useMemo(() => {
    if (!searchQuery) return false;
    const strQuery = searchQuery.toLowerCase();
    const checkValue = (val: any): boolean => {
      if (typeof val === 'string' && val.toLowerCase().includes(strQuery)) return true;
      if (typeof val === 'object' && val !== null) {
        return Object.entries(val).some(([k, v]) => k.toLowerCase().includes(strQuery) || checkValue(v));
      }
      return false;
    };
    return checkValue(value);
  }, [value, searchQuery]);

  return (
    <div className="ml-4">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1 py-0.5 cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 text-slate-300 select-none',
          hasSearchMatches && 'border-l-2 border-yellow-500 pl-1.5'
        )}
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        <span className="text-amber-400 font-semibold">{name}:</span>
        <span className="text-gray-400">
          {isArray ? `Array[${keys.length}]` : `Object{${keys.length}}`}
        </span>
      </div>
      {isOpen && (
        <div className="pl-2 border-l border-white/10 mt-0.5 flex flex-col gap-0.5">
          {keys.map((key) => {
            const childVal = (value as any)[key];
            const childPath = `${path}.${key}`;
            const childKeyMatch = searchQuery && key.toLowerCase().includes(searchQuery.toLowerCase());

            return (
              <div key={key} className="flex flex-col">
                {typeof childVal !== 'object' || childVal === null ? (
                  <div className="flex items-start gap-1 py-0.5 pl-4">
                    <span className={cn('text-amber-400 shrink-0', childKeyMatch && 'bg-yellow-500/20 text-yellow-200')}>
                      {key}:
                    </span>
                    {childVal === null ? (
                      <span className="text-gray-400 font-mono">null</span>
                    ) : typeof childVal === 'string' ? (
                      <span className={cn('text-green-400 font-mono break-all', searchQuery && childVal.toLowerCase().includes(searchQuery.toLowerCase()) && 'bg-yellow-500/20 text-yellow-200')}>
                        "{childVal}"
                      </span>
                    ) : typeof childVal === 'number' ? (
                      <span className="text-blue-400 font-mono">{childVal}</span>
                    ) : typeof childVal === 'boolean' ? (
                      <span className="text-purple-400 font-mono">{childVal ? 'true' : 'false'}</span>
                    ) : (
                      <span>{String(childVal)}</span>
                    )}
                  </div>
                ) : (
                  <JsonNode
                    name={key}
                    value={childVal}
                    depth={depth + 1}
                    expandedDepth={expandedDepth}
                    searchQuery={searchQuery}
                    path={childPath}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default JsonViewer;
