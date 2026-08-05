import React, { useState } from 'react';
import { Smartphone, ShieldCheck, UserPlus, LogIn, Lock, ArrowRight, Info } from 'lucide-react';

export default function AuthScreen({ onLogin, isSupabaseActive }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAdminLogin) {
      if (adminPassword === 'admin123' || adminPassword === 'admin') {
        onLogin({ id: 'admin_1', name: 'Administrador', role: 'admin', status: 'aprovado' });
      } else {
        alert('Senha de Administrador incorreta! (Senha padrão de demonstração: admin123)');
      }
      return;
    }

    if (!name) return;

    if (isRegister) {
      // Registrar novo usuário -> Fica como PENDENTE (Sala de Espera)
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        phone,
        role: 'user',
        status: 'pendente'
      };
      onLogin(newUser);
    } else {
      // Login Simulado ou busca
      const user = {
        id: 'user_existing',
        name,
        phone,
        role: 'user',
        status: 'pendente' // Padrão pendente se novo
      };
      onLogin(user);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <Smartphone size={40} color="#ff3b30" />
          </div>
          <h1>App de Alerta Mobile</h1>
          <p>Sistema de Alerta em Tempo Real & Sala de Espera</p>
        </div>

        {/* Toggle Modo ADM / Usuário */}
        <div className="auth-mode-toggle">
          <button 
            className={`mode-btn ${!isAdminLogin ? 'active' : ''}`}
            onClick={() => setIsAdminLogin(false)}
          >
            <UserPlus size={16} /> Entrar no Celular
          </button>
          <button 
            className={`mode-btn ${isAdminLogin ? 'active' : ''}`}
            onClick={() => setIsAdminLogin(true)}
          >
            <Lock size={16} /> Sou Administrador (ADM)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isAdminLogin ? (
            <div className="form-group">
              <label>Senha do Administrador</label>
              <input 
                type="password" 
                placeholder="Digite a senha ADM (admin123)"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="input-field"
                required
              />
              <p className="field-hint">Senha de demonstração: <strong>admin123</strong></p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Seu Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label>Celular / WhatsApp (Opcional)</label>
                <input 
                  type="tel" 
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary auth-submit-btn">
            {isAdminLogin ? (
              <>Acessar Painel ADM <ArrowRight size={18} /></>
            ) : (
              <>Entrar no Aplicativo <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {!isAdminLogin && (
          <div className="auth-info-box">
            <Info size={18} color="#007aff" />
            <p>Novos usuários entram automaticamente na <strong>Sala de Espera</strong> até que o Administrador libere o acesso.</p>
          </div>
        )}
      </div>
    </div>
  );
}
