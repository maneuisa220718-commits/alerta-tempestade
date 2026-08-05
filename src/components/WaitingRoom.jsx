import React from 'react';
import { Clock, ShieldAlert, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WaitingRoom({ user, onLogout }) {
  return (
    <div className="waiting-room-container">
      <div className="glass-card waiting-card">
        <div className="waiting-icon-wrapper">
          <Clock className="spin-slow" size={64} color="#e5c07b" />
        </div>

        <h2 className="waiting-title">Acesso em Análise</h2>
        <p className="waiting-subtitle">
          Olá, <strong className="highlight-name">{user?.name || 'Usuário'}</strong>!
        </p>

        <div className="waiting-status-box">
          <AlertCircle size={20} color="#e5c07b" />
          <span>Sua conta está na <strong>Sala de Espera</strong>.</span>
        </div>

        <p className="waiting-description">
          O Administrador foi notificado do seu cadastro. Assim que o seu acesso for 
          <span className="success-text"> LIBERADO</span> no painel, esta tela será atualizada automaticamente e você começará a receber os alertas no celular em tempo real.
        </p>

        <div className="waiting-footer">
          <button className="btn-secondary" onClick={onLogout}>
            <LogOut size={16} /> Sair / Trocar Usuário
          </button>
        </div>
      </div>
    </div>
  );
}
