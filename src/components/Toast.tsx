import { useEffect, useRef, useState } from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  text: string;
  type: 'success' | 'error';
  action?: ToastAction;
}

let showToastGlobal: ((msg: ToastMessage) => void) | null = null;

export function toast(text: string, type: 'success' | 'error' = 'success', action?: ToastAction) {
  showToastGlobal?.({ text, type, action });
}

export default function Toast() {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    showToastGlobal = (msg) => {
      setMessage(msg);
      
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      
      const duration = msg.action ? 5000 : 3000;
      timeoutRef.current = window.setTimeout(() => {
        setMessage(null);
      }, duration);
    };
    return () => {
      showToastGlobal = null;
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!message) return null;

  return (
    <div className={`toast ${message.type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-lg)' }}>
      <span>{message.text}</span>
      {message.action && (
        <button 
          onClick={() => {
            message.action!.onClick();
            setMessage(null);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--bg-primary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 'var(--font-xs)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {message.action.label}
        </button>
      )}
    </div>
  );
}
