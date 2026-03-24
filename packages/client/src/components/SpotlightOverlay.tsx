import React from 'react';
import { useEditor } from 'tldraw';
import { useLivestreamState } from '../plugin/useLivestreamContext';

/**
 * Renders a highlight rectangle when the host activates spotlight mode.
 * Non-host users see the highlighted area; optionally auto-pans to it.
 */
export function SpotlightOverlay() {
  const editor = useEditor();
  const { spotlight, role, config } = useLivestreamState();

  if (!config.enableSpotlight || !spotlight || role === 'host') return null;

  // Convert page coordinates to screen coordinates
  const screenPoint = editor.pageToScreen({ x: spotlight.x, y: spotlight.y });
  const screenEnd = editor.pageToScreen({
    x: spotlight.x + spotlight.w,
    y: spotlight.y + spotlight.h,
  });

  const width = screenEnd.x - screenPoint.x;
  const height = screenEnd.y - screenPoint.y;

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPoint.x,
        top: screenPoint.y,
        width,
        height,
        border: '3px solid #f59e0b',
        borderRadius: '4px',
        background: 'rgba(245, 158, 11, 0.08)',
        pointerEvents: 'none',
        zIndex: 998,
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
        transition: 'all 0.3s ease',
      }}
    />
  );
}
