import { useEffect } from 'react';
import { useEditor } from 'tldraw';
import { useLivestreamState } from '../plugin/useLivestreamContext';
import { canEdit, canModerate } from '../types';

/**
 * Hook that enforces role-based permissions on the tldraw editor.
 *
 * - Viewers: canvas is set to readonly mode
 * - Editors: can draw/edit normally
 * - Frozen canvas: only host/moderator can edit
 * - Rate-limited: temporarily readonly
 *
 * Must be called inside both <LivestreamPlugin> and <Tldraw onMount>.
 */
export function useRoleEnforcement() {
  const editor = useEditor();
  const { role, frozen, rateLimited } = useLivestreamState();

  useEffect(() => {
    const shouldBeReadonly = !canEdit(role) || (frozen && !canModerate(role)) || rateLimited;

    editor.updateInstanceState({ isReadonly: shouldBeReadonly });
  }, [editor, role, frozen, rateLimited]);

  // Also intercept shape changes from 'user' source when frozen
  // This is a belt-and-suspenders approach — isReadonly should block most things,
  // but sideEffects catch any edge cases
  useEffect(() => {
    if (!frozen) return;
    if (canModerate(role)) return;

    const removeCreate = editor.sideEffects.registerBeforeCreateHandler('shape', (shape, source) => {
      if (source === 'user') {
        // Can't cancel a create directly, but returning the shape is required.
        // The readonly state should already prevent this, but if it somehow gets through,
        // we schedule a delete.
        queueMicrotask(() => {
          if (editor.getShape(shape.id)) {
            editor.run(
              () => { editor.deleteShape(shape.id); },
              { history: 'ignore' }
            );
          }
        });
      }
      return shape;
    });

    const removeChange = editor.sideEffects.registerBeforeChangeHandler('shape', (prev, next, source) => {
      if (source === 'user') return prev; // block by returning previous state
      return next;
    });

    const removeDelete = editor.sideEffects.registerBeforeDeleteHandler('shape', (shape, source) => {
      if (source === 'user') return false; // block deletion
      // return void to allow
    });

    return () => {
      removeCreate();
      removeChange();
      removeDelete();
    };
  }, [editor, frozen, role]);
}
