import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, HelpCircle } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(true);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já instalou e está abrindo como App Nativo
    const isApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isApp);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Se já estiver rodando como App Instalado, não precisa mostrar o banner
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Caso o navegador não dispare o evento automático (ex: iOS Safari ou Chrome sem prompt direto), abre o guia visual
      setShowInstructionsModal(true);
    }
  };

  return (
    <>
      {/* Botão Superior Fixo de Instalação */}
      {showBanner && (
        <div className="pwa-install-top-bar">
          <div className="pwa-bar-content">
            <Smartphone size={20} color="#ff3b30" />
            <span>Instale o App na sua Tela Inicial</span>
          </div>
          <div className="pwa-bar-actions">
            <button className="btn-install-now" onClick={handleInstallClick}>
              <Download size={14} /> INSTALAR
            </button>
            <button className="btn-close-bar" onClick={() => setShowBanner(false)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal com Instruções Ilustradas (Caso o navegador não abra a janela automática) */}
      {showInstructionsModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowInstructionsModal(false)}>
          <div className="glass-card pwa-instructions-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <h3>📱 Como Instalar no Celular</h3>
              <button className="btn-icon-close" onClick={() => setShowInstructionsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pwa-steps-list">
              <div className="pwa-step">
                <span className="step-num">1</span>
                <div>
                  <strong>No Android (Chrome):</strong>
                  <p>Clique nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do navegador e selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</p>
                </div>
              </div>

              <div className="pwa-step">
                <span className="step-num">2</span>
                <div>
                  <strong>No iPhone (Safari):</strong>
                  <p>Clique no ícone de <strong>Compartilhar (quadrado com seta pra cima)</strong> e escolha <strong>"Adicionar à Tela de Início"</strong>.</p>
                </div>
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '1.2rem' }} onClick={() => setShowInstructionsModal(false)}>
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </>
  );
}
