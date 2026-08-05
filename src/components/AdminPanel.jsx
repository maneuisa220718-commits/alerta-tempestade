import React, { useState, useEffect } from 'react';
import { Send, Users, Shield, Check, X, Bell, Image as ImageIcon, Volume2, Radio, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function AdminPanel({ onLogout, mockUsers, mockAlerts, onSendMockAlert, onApproveMockUser, onRejectMockUser }) {
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' | 'users' | 'history'
  const [users, setUsers] = useState(mockUsers || []);
  const [alerts, setAlerts] = useState(mockAlerts || []);
  
  // Alert form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('critical'); // 'info' | 'warning' | 'critical'
  const [sound, setSound] = useState('siren');
  const [imageUrl, setImageUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAlerts();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) setUsers(data);
    } catch (e) {
      console.log('Supabase offline, using local state for users');
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
      if (!error && data) setAlerts(data);
    } catch (e) {
      console.log('Supabase offline, using local state for alerts');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await supabase.from('profiles').update({ status: 'aprovado' }).eq('id', userId);
    } catch (e) {}
    onApproveMockUser(userId);
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'aprovado' } : u));
  };

  const handleRejectUser = async (userId) => {
    try {
      await supabase.from('profiles').update({ status: 'recusado' }).eq('id', userId);
    } catch (e) {}
    onRejectMockUser(userId);
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'recusado' } : u));
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!message) return;
    setIsSending(true);

    const newAlert = {
      id: 'alert_' + Date.now(),
      title: title || 'ALERTA DO ADM',
      message,
      urgency,
      sound,
      image_url: imageUrl || null,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('alerts').insert([newAlert]);
    } catch (e) {
      console.log('Using mock trigger');
    }

    onSendMockAlert(newAlert);
    setAlerts([newAlert, ...alerts]);

    setIsSending(false);
    setSentSuccess(true);
    setTitle('');
    setMessage('');
    setImageUrl('');
    setTimeout(() => setSentSuccess(false), 3000);
  };

  const pendingUsers = users.filter(u => u.status === 'pendente');
  const approvedUsers = users.filter(u => u.status === 'aprovado');

  return (
    <div className="admin-container">
      {/* Header Admin */}
      <div className="admin-header glass-card">
        <div className="admin-title-area">
          <Shield color="#ff3b30" size={28} />
          <div>
            <h1>Painel do Administrador</h1>
            <p>Controle de Alertas & Sala de Espera</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={onLogout}>Sair</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dispatch' ? 'active' : ''}`} 
          onClick={() => setActiveTab('dispatch')}
        >
          <Radio size={18} /> Disparar Alerta
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Sala de Espera ({pendingUsers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
        >
          <Bell size={18} /> Historico ({alerts.length})
        </button>
      </div>

      {/* Aba 1: Disparar Alerta */}
      {activeTab === 'dispatch' && (
        <div className="glass-card tab-content">
          <h2 className="section-title">
            <Radio className="pulse-icon" color="#ff3b30" /> Novo Alerta em Tempo Real
          </h2>
          <p className="section-sub">Este alerta tocará como ligação e vibrará no celular dos usuários liberados.</p>

          <form onSubmit={handleSendAlert} className="alert-form">
            <div className="form-group">
              <label>Título do Alerta</label>
              <input 
                type="text" 
                placeholder="Ex: PERIGO NA ÁREA / REUNIÃO URGENTE" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Mensagem / Instrução *</label>
              <textarea 
                rows="4"
                placeholder="Escreva a mensagem que aparecerá na tela do celular..." 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="input-field textarea-field"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nível de Urgência</label>
                <select 
                  value={urgency} 
                  onChange={e => setUrgency(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="critical">🚨 Emergência / Crítico (Vermelho)</option>
                  <option value="warning">⚠️ Aviso / Atenção (Amarelo)</option>
                  <option value="info">ℹ️ Informativo (Azul)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Efeito Sonoro</label>
                <select 
                  value={sound} 
                  onChange={e => setSound(e.target.value)}
                  className="input-field select-field"
                >
                  <option value="siren">🔊 Sirene de Emergência</option>
                  <option value="call">📞 Toque de Chamada</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label><ImageIcon size={16} /> URL da Imagem do Alerta (Opcional)</label>
              <input 
                type="url" 
                placeholder="https://exemplo.com/imagem.jpg" 
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="input-field"
              />
            </div>

            {sentSuccess && (
              <div className="success-banner">
                <Check size={20} /> Alerta disparado com sucesso para todos os celulares!
              </div>
            )}

            <button type="submit" className="btn-primary btn-alert-trigger" disabled={isSending}>
              <Send size={20} /> {isSending ? 'DISPARANDO...' : 'DISPARAR ALERTA NO CELULAR'}
            </button>
          </form>
        </div>
      )}

      {/* Aba 2: Sala de Espera */}
      {activeTab === 'users' && (
        <div className="glass-card tab-content">
          <div className="tab-header-flex">
            <h2>Gestão de Acessos & Sala de Espera</h2>
            <button className="btn-icon" onClick={fetchUsers} title="Atualizar Lista"><RefreshCw size={18} /></button>
          </div>

          <div className="users-section">
            <h3 className="sub-header pending-title">Pessoas Aguardando Liberação ({pendingUsers.length})</h3>
            {pendingUsers.length === 0 ? (
              <p className="empty-text">Nenhuma solicitação pendente no momento.</p>
            ) : (
              <div className="users-list">
                {pendingUsers.map(user => (
                  <div key={user.id} className="user-card pending-card">
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p>{user.phone || user.email || 'Sem contato'}</p>
                      <span className="badge badge-pending">Na Sala de Espera</span>
                    </div>
                    <div className="user-actions">
                      <button className="btn-action btn-approve" onClick={() => handleApproveUser(user.id)}>
                        <Check size={16} /> Liberar Acesso
                      </button>
                      <button className="btn-action btn-reject" onClick={() => handleRejectUser(user.id)}>
                        <X size={16} /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="sub-header approved-title" style={{ marginTop: '2rem' }}>Usuários Aprovados ({approvedUsers.length})</h3>
            <div className="users-list">
              {approvedUsers.map(user => (
                <div key={user.id} className="user-card approved-card">
                  <div className="user-info">
                    <h4>{user.name} {user.role === 'admin' && '(ADM)'}</h4>
                    <span className="badge badge-approved">Acesso Liberado</span>
                  </div>
                  {user.role !== 'admin' && (
                    <button className="btn-action btn-reject" onClick={() => handleRejectUser(user.id)}>
                      Bloquear
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aba 3: Histórico */}
      {activeTab === 'history' && (
        <div className="glass-card tab-content">
          <h2>Histórico de Alertas Enviados</h2>
          {alerts.length === 0 ? (
            <p className="empty-text">Nenhum alerta disparado ainda.</p>
          ) : (
            <div className="history-list">
              {alerts.map(a => (
                <div key={a.id} className={`history-card urgency-${a.urgency}`}>
                  <div className="history-header">
                    <h3>{a.title}</h3>
                    <span>{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <p>{a.message}</p>
                  {a.image_url && <img src={a.image_url} alt="anexo" className="history-thumb" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
