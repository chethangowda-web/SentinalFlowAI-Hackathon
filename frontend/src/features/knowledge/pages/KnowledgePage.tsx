import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { KnowledgeGraph } from '@/components/ai/KnowledgeGraph';

const MOCK_NODES = [
  { name: 'Database Troubleshooting', category: 0, symbolSize: 25 },
  { name: 'TCP Pool Settings', category: 0, symbolSize: 15 },
  { name: 'Qdrant Integration', category: 1, symbolSize: 20 },
  { name: 'Mastra Engine Setup', category: 2, symbolSize: 20 },
  { name: 'Auth Server Logs', category: 1, symbolSize: 15 },
];

const MOCK_LINKS = [
  { source: 'Database Troubleshooting', target: 'TCP Pool Settings' },
  { source: 'Database Troubleshooting', target: 'Qdrant Integration' },
  { source: 'Qdrant Integration', target: 'Mastra Engine Setup' },
  { source: 'Mastra Engine Setup', target: 'Auth Server Logs' },
];

const MOCK_CATEGORIES = ['Troubleshooting', 'Integrations', 'Platform Setup'];

export function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Knowledge Base Search</h1>
        <p className="text-sm text-muted-foreground">Index and explore contextual platform troubleshooting manuals</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search platform documents, wiki articles, and diagnostic guides..." className="pl-9 h-10 text-xs bg-card" />
      </div>

      <KnowledgeGraph nodes={MOCK_NODES} links={MOCK_LINKS} categories={MOCK_CATEGORIES} />
    </div>
  );
}

export default KnowledgePage;
