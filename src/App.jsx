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

  // Carregar histórico de alertas ao entrar
  useEffect(() => {
    if (!supabaseReady) return;

    const fetchInitialAlerts = async () => {
      try {
        const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(20);
        if (data) setAlertsHistory(data);
      } catch (e) {
        console.error('Erro ao buscar alertas:', e);
      }
    };

    fetchInitialAlerts();
  }, [supabaseReady]);

  // Listener Realtime GLOBAL de Alertas (Escuta a qualquer momento, independente se currentUser já carregou)
  useEffect(() => {
    if (!supabaseReady) return;

    console.log('Iniciando Listener Realtime para tabela alerts...');
    const alertsChannel = supabase
      .channel('global_alerts_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        console.log('🚨 NOVO ALERTA RECEBIDO VIA REALTIME:', payload.new);
        const newAlert = payload.new;
        
        // Ativa a tela de ligação e vibração para o usuário ativo
        setActiveAlert(newAlert);
        setAlertsHistory((prev) => [newAlert, ...prev]);
      })
      .subscribe((status) => {
        console.log('Status da inscrição Realtime Supabase:', status);
      });

    // Escutar atualizações de status do usuário (aprovação na Sala de Espera)
    const profilesChannel = supabase
      .channel('global_profiles_realtime')
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
  }, [supabaseReady, currentUser?.id]);

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
      title: urgencyType === 'critical' ? 'LOMBROU FUNDAO' : '📢 AVISO DO ADM',
      message: 'Este é um teste do alerta em tempo real no celular com toque estilo ligação e vibração!',
      urgency: urgencyType,
      sound: urgencyType === 'critical' ? 'siren' : 'call',
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

      {/* Botão e Banner de Instalação PWA no Celular */}
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

      {/* Overlay estilo chamada LOMBROU (Ativado instantaneamente quando activeAlert for preenchido) */}
      {activeAlert && (
        <CallAlertOverlay 
          alert={activeAlert} 
          onClose={() => setActiveAlert(null)} 
        />
      )}
    </div>
  );
}
