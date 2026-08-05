import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import WaitingRoom from './components/WaitingRoom';
import AdminPanel from './components/AdminPanel';
import UserView from './components/UserView';
import CallAlertOverlay from './components/CallAlertOverlay';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ShieldAlert, Database, Server, Smartphone, ExternalLink } from 'lucide-react';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  
  // Estado local simulado caso o Supabase não esteja com credenciais configuradas ainda
  const [mockUsers, setMockUsers] = useState([
    { id: 'usr_1', name: 'João Santos', phone: '(11) 98888-1111', role: 'user', status: 'pendente' },
    { id: 'usr_2', name: 'Maria Oliveira', phone: '(21) 97777-2222', role: 'user', status: 'aprovado' }
  ]);

  const supabaseReady = isSupabaseConfigured();

  // Listener em tempo real via Supabase (ou Event Listener para demonstração)
  useEffect(() => {
    if (!supabaseReady) return;

    // Escutar novos alertas na tabela 'alerts'
    const alertsChannel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const newAlert = payload.new;
        if (currentUser && currentUser.status === 'aprovado') {
          setActiveAlert(newAlert);
          setAlertsHistory((prev) => [newAlert, ...prev]);
        }
      })
      .subscribe();

    // Escutar mudanças de permissão na tabela 'profiles' para atualizar sala de espera
    const profilesChannel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const updated = payload.new;
        if (currentUser && currentUser.id === updated.id) {
          setCurrentUser(updated);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [currentUser, supabaseReady]);

  const handleLogin = (user) => {
    // Verificar se já existe mock com mesmo nome
    const existing = mockUsers.find(u => u.name.toLowerCase() === user.name.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
    } else {
      setCurrentUser(user);
      setMockUsers((prev) => [...prev, user]);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveAlert(null);
  };

  // Funções de simulação local para o painel de adm
  const handleSendMockAlert = (newAlert) => {
    setAlertsHistory((prev) => [newAlert, ...prev]);
    // Se o usuário logado for 'aprovado', dispara o alerta estilo ligação
    if (currentUser && currentUser.status === 'aprovado' && currentUser.role !== 'admin') {
      setActiveAlert(newAlert);
    }
  };

  const handleApproveMockUser = (userId) => {
    setMockUsers((prev) => prev.map(u => u.id === userId ? { ...u, status: 'aprovado' } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, status: 'aprovado' }));
    }
  };

  const handleRejectMockUser = (userId) => {
    setMockUsers((prev) => prev.map(u => u.id === userId ? { ...u, status: 'recusado' } : u));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, status: 'recusado' }));
    }
  };

  const handleSimulateIncomingAlert = (urgencyType = 'critical') => {
    const simAlert = {
      id: 'sim_' + Date.now(),
      title: urgencyType === 'critical' ? '🚨 PERIGO DE EMERGÊNCIA' : '📢 AVISO DO ADM',
      message: 'Este é um teste do alerta em tempo real. O celular vibrou e o som estilo ligação foi ativado!',
      urgency: urgencyType,
      sound: urgencyType === 'critical' ? 'siren' : 'call',
      image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=60',
      created_at: new Date().toISOString()
    };
    setActiveAlert(simAlert);
    setAlertsHistory((prev) => [simAlert, ...prev]);
  };

  return (
    <div className="app-root">
      {/* Banner Superior de Instruções Supabase & Vercel */}
      {!supabaseReady && (
        <div className="dev-mode-banner">
          <div className="banner-content">
            <Database size={16} />
            <span>
              <strong>Modo de Demonstração Interativo Ativo:</strong> Para conectar seu próprio banco do <strong>Supabase</strong> e publicar no <strong>Vercel / GitHub</strong>, siga as variáveis de ambiente `.env`.
            </span>
          </div>
        </div>
      )}

      {/* Roteamento Principal da Aplicação */}
      {!currentUser ? (
        <AuthScreen onLogin={handleLogin} isSupabaseActive={supabaseReady} />
      ) : currentUser.role === 'admin' ? (
        <AdminPanel 
          onLogout={handleLogout}
          mockUsers={mockUsers}
          mockAlerts={alertsHistory}
          onSendMockAlert={handleSendMockAlert}
          onApproveMockUser={handleApproveMockUser}
          onRejectMockUser={handleRejectMockUser}
        />
      ) : currentUser.status === 'pendente' ? (
        <WaitingRoom user={currentUser} onLogout={handleLogout} />
      ) : currentUser.status === 'recusado' ? (
        <div className="glass-card error-card">
          <h2>Acesso Recusado</h2>
          <p>O administrador não aprovou sua entrada no aplicativo.</p>
          <button className="btn-secondary" onClick={handleLogout}>Voltar</button>
        </div>
      ) : (
        <UserView 
          user={currentUser} 
          onLogout={handleLogout}
          activeAlert={activeAlert}
          alertsHistory={alertsHistory}
          onSimulateIncomingAlert={handleSimulateIncomingAlert}
        />
      )}

      {/* Overlay Estilo Tela de Ligação com Vibração e Som */}
      {activeAlert && (
        <CallAlertOverlay 
          alert={activeAlert} 
          onClose={() => setActiveAlert(null)} 
        />
      )}
    </div>
  );
}
