import { useEffect, useRef, useState } from 'react';
import { createScene, type SceneHandle } from './createScene';
import type { EditorHandle } from './editor/EditorController';
import { getQueryParam } from '../../common/queryParams';

export function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const editorRef = useRef<EditorHandle | null>(null);
  const [isNight, setIsNight] = useState(true);
  const isEditMode = getQueryParam('edit') === '1';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container, true);
    handleRef.current = handle;

    let cancelled = false;
    if (getQueryParam('edit') === '1') {
      import('./editor/EditorController').then(({ mountEditor }) => {
        if (cancelled) return;
        editorRef.current = mountEditor(handle, container);
      });
    }

    return () => {
      cancelled = true;
      editorRef.current?.unmount();
      editorRef.current = null;
      handleRef.current = null;
      handle.dispose();
    };
  }, []);

  const handleToggle = () => {
    setIsNight((prev) => {
      const next = !prev;
      handleRef.current?.setMode(next);
      return next;
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#05070a' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {!isEditMode && (
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute',
            top: 22,
            right: 22,
            zIndex: 10,
            padding: '10px 18px',
            borderRadius: 999,
            border: '1px solid rgba(140,255,190,0.35)',
            background: 'rgba(8,20,14,0.55)',
            backdropFilter: 'blur(8px)',
            color: '#d8ffe8',
            fontFamily: '"Courier New", monospace',
            fontSize: 13,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {isNight ? 'Switch to Day' : 'Switch to Night'}
        </button>
      )}
    </div>
  );
}
