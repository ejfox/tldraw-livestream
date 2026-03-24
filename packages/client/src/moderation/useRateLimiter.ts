import { useEffect, useRef } from 'react';
import { useEditor } from 'tldraw';
import { useLivestreamState } from '../plugin/useLivestreamContext';

/**
 * Client-side optimistic rate limiter.
 *
 * Tracks shape operations per window and warns the user before the
 * server-side limiter kicks in. This is cosmetic — the server is authoritative.
 */
export function useRateLimiter() {
  const editor = useEditor();
  const { config } = useLivestreamState();
  const opsRef = useRef<number[]>([]);

  useEffect(() => {
    const cleanup = editor.store.listen(
      (entry) => {
        // Count shape-related changes from local source
        const now = Date.now();
        const shapeChanges = Object.keys(entry.changes.added)
          .concat(Object.keys(entry.changes.updated))
          .concat(Object.keys(entry.changes.removed))
          .filter((key) => key.startsWith('shape:'));

        if (shapeChanges.length === 0) return;

        opsRef.current.push(now);

        // Trim old entries outside the window
        const cutoff = now - config.rateLimitWindow;
        opsRef.current = opsRef.current.filter((t) => t > cutoff);

        // Warn at 80% of limit
        if (opsRef.current.length > config.rateLimitMax * 0.8) {
          console.warn(
            `[tldraw-livestream] Rate limit warning: ${opsRef.current.length}/${config.rateLimitMax} ops in ${config.rateLimitWindow}ms window`
          );
        }
      },
      { source: 'user', scope: 'document' }
    );

    return cleanup;
  }, [editor, config.rateLimitMax, config.rateLimitWindow]);
}
