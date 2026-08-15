import React, { useState, useEffect } from 'react';
import { Radio, Volume2, Smartphone, Image as ImageIcon, Bell, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { stopSound, stopVibration, playEmergencyAlertSound, triggerVibration } from '../services/soundService';

export default function CallAlertOverlay({ alert, onClose, userPreferences }) {
  // Garante valores padrão caso as preferências não estejam definidas
  const soundEnabled = userPreferences?.soundEnabled ?? true;
  const vibrationEnabled = userPreferences?.vibrationEnabled ?? true;
  const imageEnabled = userPreferences?.imageEnabled ?? true;

  // Imagem padrão chamativa de emergência caso o alerta do card não passe uma imagem específica
  const defaultAlertImage = 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80';
  const alertImageToDisplay = alert?.image_url || defaultAlertImage;

  useEffect(() => {
    if (alert) {
      // 1. Toca o som da sirene de emergência se estiver ativado
      if (soundEnabled) {
        playEmergencyAlertSound();
      } else {
        stopSound();
      }

      // 2. Dispara a vibração contínua do celular se estiver ativada
      if (vibrationEnabled) {
        triggerVibration();
      } else {
        stopVibration();
      }
    }

    return () => {
      stopSound();
      stopVibration();
    };
  }, [alert, soundEnabled, vibrationEnabled]);

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

        {/* Exibe a imagem de alerta se a opção de Exibir Imagem estiver ATIVADA */}
        {imageEnabled && alertImageToDisplay && (
          <div className="call-image-wrapper">
            <img src={alertImageToDisplay} alt="Alerta de Emergência" className="call-alert-image" />
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
