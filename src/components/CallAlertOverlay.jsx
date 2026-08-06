import React, { useState } from 'react';
import { Radio, Check, AlertTriangle } from 'lucide-react';
import { stopSound, stopVibration, playEmergencyAlertSound, triggerVibration } from '../services/soundService';

export default function CallAlertOverlay({ alert, onClose }) {
  React.useEffect(() => {
    if (alert) {
      triggerVibration();
      playEmergencyAlertSound();
    }

    return () => {
      stopSound();
      stopVibration();
    };
  }, [alert]);

  if (!alert) return null;

  const handleAcknowledge = () => {
    stopSound();
    stopVibration();
    if (onClose) onClose();
  };

  // Formatação do título estilo "LOMBROU FUNDAO"
  const isLombrou = alert.title?.toUpperCase().startsWith('LOMBROU');
  const alertTitleText = isLombrou ? alert.title.toUpperCase() : `LOMBROU ${alert.title?.toUpperCase()}`;

  return (
    <div className="call-overlay-backdrop flashing-red-bg">
      <div className="call-overlay-container">

        {/* Animação Pulsação Estilo Chamada */}
        <div className="call-pulse-ring-red"></div>
        <div className="call-pulse-ring-red ring-delay"></div>

        {/* Cabeçalho de Alerta */}
        <div className="call-header">
          <div className="lombrou-badge-pulse">
            <AlertTriangle className="pulse-icon-fast" size={24} />
            <span>ALERTA DE EMERGÊNCIA</span>
          </div>
        </div>

        {/* Título GIGANTE "LOMBROU FUNDAO" */}
        <div className="lombrou-title-container">
          <h1 className="lombrou-title-text">{alertTitleText}</h1>
        </div>

        {/* Imagem do Alerta (se houver) */}
        {alert.image_url && (
          <div className="call-image-wrapper">
            <img src={alert.image_url} alt="Alerta" className="call-alert-image" />
          </div>
        )}

        {/* Mensagem / Descrição */}
        <div className="call-content">
          <p className="call-message-bold">{alert.message || 'ALERTA DE EMERGÊNCIA ATIVADO PELO ADMINISTRADOR'}</p>
          <span className="call-time">{new Date(alert.created_at || Date.now()).toLocaleTimeString()}</span>
        </div>

        {/* Botão de Confirmação */}
        <div className="call-actions">
          <button className="call-btn btn-accept" onClick={handleAcknowledge}>
            <div className="btn-icon-circle-red">
              <Check size={36} />
            </div>
            <span className="btn-confirm-text">ENTENDIDO / CONFIRMAR LEITURA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
