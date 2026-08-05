import React, { useState } from 'react';
import { PhoneCall, Bell, ShieldAlert, X, Check, Volume2, AlertTriangle, Radio } from 'lucide-react';
import { playEmergencyAlertSound, playCallIncomingSound, stopSound, triggerVibration, stopVibration } from '../services/soundService';

export default function CallAlertOverlay({ alert, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    if (alert) {
      triggerVibration();
      if (alert.sound === 'siren' || alert.urgency === 'critical') {
        playEmergencyAlertSound();
      } else {
        playCallIncomingSound();
      }
      setIsPlaying(true);
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
    setIsPlaying(false);
    if (onClose) onClose();
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'critical':
        return { label: 'ALERTA CRÍTICO DE EMERGÊNCIA', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.2)' };
      case 'warning':
        return { label: 'AVISO IMPORTANTE', color: '#ffcc00', bg: 'rgba(255, 204, 0, 0.2)' };
      default:
        return { label: 'NOTIFICAÇÃO INFORMATIVA', color: '#007aff', bg: 'rgba(0, 122, 255, 0.2)' };
    }
  };

  const urgencyInfo = getUrgencyBadge(alert.urgency);

  return (
    <div className="call-overlay-backdrop">
      <div className="call-overlay-container">
        {/* Animação Pulsação Estilo Chamada */}
        <div className="call-pulse-ring"></div>
        <div className="call-pulse-ring ring-delay"></div>

        {/* Cabeçalho de Alerta */}
        <div className="call-header">
          <div className="urgency-badge" style={{ backgroundColor: urgencyInfo.bg, color: urgencyInfo.color, borderColor: urgencyInfo.color }}>
            <Radio className="pulse-icon" size={16} />
            <span>{urgencyInfo.label}</span>
          </div>
          <p className="call-subtitle">Alerta transmitido pelo Administrador</p>
        </div>

        {/* Imagem do Alerta (se enviada) */}
        {alert.image_url ? (
          <div className="call-image-wrapper">
            <img src={alert.image_url} alt="Alerta" className="call-alert-image" />
          </div>
        ) : (
          <div className="call-icon-placeholder">
            <ShieldAlert size={64} color={urgencyInfo.color} />
          </div>
        )}

        {/* Detalhes do Conteúdo */}
        <div className="call-content">
          <h1 className="call-title">{alert.title || 'Novo Alerta Recebido!'}</h1>
          <p className="call-message">{alert.message}</p>
          <span className="call-time">{new Date(alert.created_at || Date.now()).toLocaleTimeString()}</span>
        </div>

        {/* Painel de Ação (Atender / Confirmar) */}
        <div className="call-actions">
          <button className="call-btn btn-accept" onClick={handleAcknowledge}>
            <div className="btn-icon-circle">
              <Check size={28} />
            </div>
            <span>ENTENDIDO / RECEBIDO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
