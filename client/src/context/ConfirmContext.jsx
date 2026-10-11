import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    setOptions({
      title: 'Are you sure?',
      message: '',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel',
      danger: false,
      ...opts,
    });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (value) => {
    setOptions(null);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div className="modal-backdrop" onClick={() => close(false)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="confirm-wrap">
              <div className="icon-big">{options.danger ? '⚠️' : '💬'}</div>
              <h3 style={{ color: 'var(--forest)', marginTop: '0.6rem' }}>{options.title}</h3>
              {options.message && <p className="muted">{options.message}</p>}
              <div className="confirm-actions">
                <button type="button" className="btn btn-outline" onClick={() => close(false)}>
                  {options.cancelLabel}
                </button>
                <button
                  type="button"
                  className={`btn ${options.danger ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => close(true)}
                  autoFocus
                >
                  {options.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}