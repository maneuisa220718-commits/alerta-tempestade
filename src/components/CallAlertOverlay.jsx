import React, { useState, useEffect } from 'react';
import { Radio, Volume2, Smartphone, Image as ImageIcon, Bell, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { stopSound, stopVibration, playEmergencyAlertSound, triggerVibration } from '../services/soundService';

export default function CallAlertOverlay({ alert, onClose, userPreferences }) {
  // Configurações padrão de preferências do usuário (se não passadas, ativa todas)
  const prefs = userPreferences || {
    soundEnabled: true,
    vibrationEnabled: true,
    imageEnabled: true
  };

  useEffect(() => {
    if (alert) {
      // Executa vibração apenas se o usuário permitiu nas configurações
      if (prefs.vibrationEnabled) {
        triggerVibration();
      }

      // Toca o som apenas se o usuário permitiu nas configurações
      if (prefs.soundEnabled) {
        playEmergencyAlertSound();
      }
    }

    return () => {
      stopSound();
      stopVibration();
    };
  }, [alert, prefs]);

  if (!alert) return null;

  const handleAcknowledge = () => {
    stopSound();
    stopVibration();
    if (onClose) onClose();
  };

  const isLombrou = alert.title?.toUpperCase().startsWith('LOMBROU');
  const alertTitleText = isLombrou ? alert.title.toUpperCase() : `LOMBROU ${alert.title?.toUpperCase()}`;

  return (
    <div className="call-overlay-backdrop flashing-red-bg">
      <div className="call-overlay-container">

        <div className="call-pulse-ring-red"></div>
        <div className="call-pulse-ring-red ring-delay"></div>

        <div className="call-header">
          <div className="lombrou-badge-pulse">
            <Radio className="pulse-icon-fast" size={24} />
            <span>ALERTA DE EMERGÊNCIA</span>
          </div>
        </div>

        {/* Título GIGANTE LOMBROU */}
        <div className="lombrou-title-container">
          <h1 className="lombrou-title-text">{alertTitleText}</h1>
        </div>

        {/* Exibe a imagem APENAS se o usuário deixou ativada a opção de Imagem */}
        {prefs.imageEnabled && alert.image_url && (
          <div className="call-image-wrapper">
            <img src={alert.image_url} alt="Alerta" className="call-alert-image" />
          </div>
        )}

        <div className="call-content">
          <p className="call-message-bold">{alert.message || 'ALERTA DE EMERGÊNCIA ATIVADO PELO ADMINISTRADOR'}</p>
          <span className="call-time">{new Date(alert.created_at || Date.now()).toLocaleTimeString()}</span>
        </div>

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
