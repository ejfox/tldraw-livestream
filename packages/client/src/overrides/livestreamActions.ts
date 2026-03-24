import type { TLUiOverrides } from 'tldraw';

/**
 * tldraw UI action overrides for livestream features.
 *
 * Adds keyboard shortcuts and menu items for moderation actions.
 *
 * Usage:
 * ```tsx
 * <Tldraw overrides={[yourOverrides, livestreamOverrides]} />
 * ```
 */
export const livestreamOverrides: TLUiOverrides = {
  actions(editor, actions) {
    // Add freeze toggle action (Ctrl+Shift+F)
    actions['livestream-freeze'] = {
      id: 'livestream-freeze',
      label: 'Toggle Freeze Canvas',
      kbd: '!$f',
      onSelect() {
        // Dispatch a custom event that LivestreamPlugin listens for
        window.dispatchEvent(new CustomEvent('livestream:toggle-freeze'));
      },
    };

    // Add snapshot action (Ctrl+Shift+S)
    actions['livestream-snapshot'] = {
      id: 'livestream-snapshot',
      label: 'Save Snapshot',
      kbd: '!$s',
      onSelect() {
        window.dispatchEvent(new CustomEvent('livestream:save-snapshot'));
      },
    };

    return actions;
  },
};
