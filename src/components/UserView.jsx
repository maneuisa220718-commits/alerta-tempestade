import React, { useState, useEffect } from 'react';
import { Bell, Shield, Phone, Radio, Smartphone, AlertTriangle, CheckCircle, Volume2, ShieldAlert } from 'lucide-react';
import { playEmergencyAlertSound, playCallIncomingSound } from '../services/soundService';

export default function UserView({ user, onLogout, activeAlert, alertsHistory, onSimulateIncomingAlert }) {
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
    }
  };

  return (
    <div className="user-dashboard">
      {/* Top Header */}
      <div className="glass-card user-header">
        <div className="user-profile">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h3>{user.name}</h3>
            <span className="badge badge-approved">Status: Acesso Liberado</span>
          </div>
        </div>
        <button className="btn-secondary btn-sm" onClick={onLogout}>Sair</button>
      </div>

      {/* Banner de Status de Conexão com Alertas */}
      <div className="glass-card status-banner-card">
        <div className="status-indicator">
          <span className="pulse-dot"></span>
          <span>Conectado à Central de Alertas</span>
        </div>
        <p className="status-hint">Mantenha esta página ou app aberto no celular para receber os alertas instantâneos.</p>
      </div>

      {/* Permissão de Notificação */}
      {!hasNotificationPermission && (
        <div className="glass-card permission-card">
          <div className="permission-info">
            <Bell size={24} color="#ffcc00" />
            <div>
              <h4>Ativar Notificações do Celular</h4>
              <p>Permita as notificações para o celular tocar quando houver um alerta do ADM.</p>
            </div>
          </div>
          <button className="btn-primary" onClick={requestNotificationPermission}>
            Ativar Notificações
          </button>
        </div>
      )}

      {/* Botões de Teste Simulação */}
      <div className="glass-card test-card">
        <h4><Smartphone size={18} /> Testar Alerta no Celular</h4>
        <p>Clique abaixo para testar como a tela estilo ligação e a vibração funcionam:</p>
        <div className="test-buttons">
          <button className="btn-test btn-test-critical" onClick={() => onSimulateIncomingAlert('critical')}>
            <Radio size={16} /> Testar Alerta de Emergência
          </button>
          <button className="btn-test btn-test-warning" onClick={() => onSimulateIncomingAlert('warning')}>
            <Volume2 size={16} /> Testar Chamada Informativa
          </button>
        </div>
      </div>

      {/* Feed de Alertas Recebidos */}
      <div className="glass-card history-card-section">
        <h3><Bell size={20} /> Feed de Alertas Recebidos</h3>
        {alertsHistory.length === 0 ? (
          <div className="empty-alerts">
            <ShieldAlert size={48} color="#4b5563" />
            <p>Nenhum alerta enviado pelo administrador até o momento.</p>
          </div>
        ) : (
          <div className="user-alerts-list">
            {alertsHistory.map((a) => (
              <div key={a.id} className={`user-alert-item urgency-${a.urgency}`}>
                <div className="user-alert-header">
                  <span className="user-alert-title">{a.title}</span>
                  <span className="user-alert-date">{new Date(a.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="user-alert-msg">{a.message}</p>
                {a.image_url && <img src={a.image_url} alt="imagem do alerta" className="user-alert-img" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
