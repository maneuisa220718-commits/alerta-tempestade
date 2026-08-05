import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import WaitingRoom from './components/WaitingRoom';
import AdminPanel from './components/AdminPanel';
import MobileMainLayout from './components/MobileMainLayout';
import CallAlertOverlay from './components/CallAlertOverlay';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Database } from 'lucide-react';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  
  const [mockUsers, setMockUsers] = useState([
    { id: 'usr_1', vulgo: 'João_Santos', role: 'user', status: 'pendente' },
    { id: 'usr_2', vulgo: 'Maria_22', role: 'user', status: 'aprovado' }
  ]);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) return;

    // Escutar novos alertas na tabela 'alerts' em tempo real
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

    // Escutar atualizações de status de usuário (Aprovação pelo ADM)
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

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveAlert(null);
  };

  const handleSendMockAlert = (newAlert) => {
    setAlertsHistory((prev) => [newAlert, ...prev]);
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

  const handleSimulateAlert = (urgencyType = 'critical') => {
    const simAlert = {
      id: 'sim_' + Date.now(),
      title: urgencyType === 'critical' ? '🚨 ALERTA CRÍTICO DE EMERGÊNCIA' : '📢 AVISO DO ADM',
      message: 'Este é um teste do alerta em tempo real no celular com toque estilo ligação e vibração!',
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
      {/* Banner de Demonstração */}
      {!supabaseReady && (
        <div className="dev-mode-banner">
          <div className="banner-content">
            <Database size={16} />
            <span>Modo de Demonstração Local Ativo</span>
          </div>
        </div>
      )}

      {/* Roteamento Principal */}
      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
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
          <p>O administrador recusou a sua solicitação de acesso.</p>
          <button className="btn-secondary" onClick={handleLogout}>Voltar</button>
        </div>
      ) : (
        /* Tela Principal com Menu Inferior (Início / Feed, Alertas, Chat) */
        <MobileMainLayout 
          user={currentUser}
          onLogout={handleLogout}
          activeAlert={activeAlert}
          alertsHistory={alertsHistory}
          onSimulateAlert={handleSimulateAlert}
        />
      )}

      {/* Overlay estilo chamada */}
      {activeAlert && (
        <CallAlertOverlay 
          alert={activeAlert} 
          onClose={() => setActiveAlert(null)} 
        />
      )}
    </div>
  );
}
