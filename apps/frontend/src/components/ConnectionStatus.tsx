'use client';

import { Badge } from '@/components/ui/badge';
import { useIsConnected } from '@/store/connectionStore';

export function ConnectionStatus() {
  const isConnected = useIsConnected();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Real-time:</span>
      <Badge variant={isConnected ? 'default' : 'destructive'}>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </Badge>
    </div>
  );
}
