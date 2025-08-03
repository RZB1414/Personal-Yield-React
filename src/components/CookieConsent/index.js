import React, { useEffect, useState } from 'react';

const CookieConsent = ({ onAccept }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    } else {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShow(false);
    onAccept();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      background: '#222',
      color: '#fff',
      padding: '16px',
      zIndex: 9999,
      textAlign: 'center',
    }}>
      <span>
        Este site utiliza cookies de terceiros para autenticação.<br />
        Você aceita o uso de cookies?
      </span>
      <button
        style={{ marginLeft: 16, padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4 }}
        onClick={handleAccept}
      >
        Aceitar
      </button>
    </div>
  );
};

export default CookieConsent;
