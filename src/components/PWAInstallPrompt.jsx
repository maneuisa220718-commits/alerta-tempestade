import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Previne a barra nativa genérica e guarda o evento para disparar no nosso botão
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Para instalar no seu celular:\n\n• No Android (Chrome): Clique nos 3 pontinhos do topo e selecione "Adicionar à Tela de Início".\n• No iPhone (Safari): Clique no botão Compartilhar e selecione "Adicionar à Tela de Início".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação do PWA');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) {
    // Botão permanente no rodapé de ajuda se o banner fechar
    return (
      <button className="btn-install-floating" onClick={handleInstallClick} title="Instalar no Celular">
        <Download size={18} />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <div className="pwa-install-banner glass-card">
      <div className="pwa-install-info">
        <div className="pwa-icon-box">
          <Smartphone size={24} color="#ff3b30" />
        </div>
        <div>
          <h4>Instalar o Aplicativo no Celular</h4>
          <p>Adicione à sua tela inicial para usar como um app nativo!</p>
        </div>
      </div>
      <div className="pwa-install-actions">
        <button className="btn-primary btn-sm" onClick={handleInstallClick}>
          <Download size={16} /> INSTALAR AGORA
        </button>
        <button className="btn-icon-close" onClick={() => setShowPrompt(false)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
