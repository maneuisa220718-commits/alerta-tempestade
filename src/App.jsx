import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import WaitingRoom from './components/WaitingRoom';
import MobileMainLayout from './components/MobileMainLayout';
import CallAlertOverlay from './components/CallAlertOverlay';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Database } from 'lucide-react';
import './index.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseReady) return;

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

    const profilesChannel = supabase
      .channel('public:profiles_current')
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
      {!supabaseReady && (
        <div className="dev-mode-banner">
          <div className="banner-content">
            <Database size={16} />
            <span>Modo de Demonstração Local Ativo</span>
          </div>
        </div>
      )}

      {/* Botão e Prompt Flutuante de Instalação PWA no Celular */}
      <PWAInstallPrompt />

      {/* ROTEAMENTO UNIFICADO MOBILE */}
      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.status === 'pendente' && currentUser.role !== 'admin' ? (
        <WaitingRoom user={currentUser} onLogout={handleLogout} />
      ) : currentUser.status === 'recusado' ? (
        <div className="glass-card error-card" style={{ margin: '2rem 1rem', textCenter: 'center' }}>
          <h2>Acesso Recusado</h2>
          <p>O administrador recusou a sua solicitação de acesso.</p>
          <button className="btn-secondary" onClick={handleLogout} style={{ marginTop: '1rem' }}>Voltar</button>
        </div>
      ) : (
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
