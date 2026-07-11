import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { KnowledgeGraph } from '@/components/ai/KnowledgeGraph';
import { SimilarityCard } from '@/components/ai/SimilarityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { knowledgeApi } from '../api/knowledgeApi';

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: graphData, isLoading: loadingGraph, isError: errorGraph } = useQuery({
    queryKey: ['knowledge', 'graph'],
    queryFn: () => knowledgeApi.getKnowledgeGraph(),
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ['knowledge', 'search', debouncedQuery],
    queryFn: () => knowledgeApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const { data: similarResults = [] } = useQuery({
    queryKey: ['knowledge', 'similar'],
    queryFn: () => knowledgeApi.getSimilar(),
  });

  const nodes = graphData?.nodes?.map((n) => ({
    name: n.name,
    category: n.categoryIndex ?? 0,
    symbolSize: n.symbolSize ?? 20,
  })) ?? [];

  const links = graphData?.links?.map((l) => ({
    source: l.source,
    target: l.target,
  })) ?? [];

  const categories = graphData?.categories ?? [];

  if (errorGraph) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base Search</h1>
          <p className="text-sm text-muted-foreground">Index and explore contextual platform troubleshooting manuals</p>
        </div>
        <div className="text-xs text-muted-foreground text-center py-12">
          Failed to load knowledge base. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base Search</h1>
        <p className="text-sm text-muted-foreground">Index and explore contextual platform troubleshooting manuals</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search platform documents, wiki articles, and diagnostic guides..."
          className="pl-9 h-10 text-xs bg-card"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {debouncedQuery && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Search Results {loadingSearch ? '(loading...)' : `(${searchResults?.length ?? 0})`}
          </h2>
          {loadingSearch ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((result) => (
                <Card key={result.id} className="bg-card border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs font-semibold text-foreground truncate">{result.title}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">{result.content}</div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{result.category}</span>
                      <span className="font-mono">{(result.score * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No results found.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loadingGraph ? (
            <Skeleton className="h-[400px] w-full" />
          ) : nodes.length > 0 ? (
            <KnowledgeGraph nodes={nodes} links={links} categories={categories} />
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-xs text-muted-foreground text-center">
                No knowledge graph data available.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Related Documents</h2>
          {similarResults.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8 text-xs text-muted-foreground text-center">
                No similar documents found.
              </CardContent>
            </Card>
          ) : (
            similarResults.slice(0, 5).map((item) => (
              <SimilarityCard
                key={item.id}
                currentTitle={item.title}
                similarTitle={item.title}
                similarId={item.id}
                similarityScore={Math.round(item.similarity * 100)}
                matchDetails={[
                  `Severity: ${item.severity}`,
                  item.runbookUsed ? `Runbook: ${item.runbookUsed}` : 'No runbook used',
                  item.resolvedAt ? `Resolved: ${new Date(item.resolvedAt).toLocaleDateString()}` : 'Not yet resolved',
                ]}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgePage;
