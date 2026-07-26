import { useEffect, useRef, useState } from 'react';
import { createScene, type SceneHandle } from './createScene';

const SEED_MESSAGES: Array<[string, string]> = [
  ['fern_walker', "still can't believe this thing boots"],
  ['byteoverbark', 'the moss on the vents is a whole ecosystem'],
  ['pixel_moth', 'green screen glow hits different at night'],
  ['old_growth_os', 'anyone know what year this rig is from'],
  ['canopy_ctrl', 'respect for whoever left this running'],
];

export function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);
    handleRef.current = handle;
    for (const [user, text] of SEED_MESSAGES) {
      handle.addMessage(user, text);
    }

    return () => {
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
    </div>
  );
}
