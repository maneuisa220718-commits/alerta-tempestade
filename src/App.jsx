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
  
  // Estado local das preferências personalizadas de alerta do usuário
  const [userPreferences, setUserPreferences] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    imageEnabled: true
  });

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

  // Listener Realtime GLOBAL de Alertas
  useEffect(() => {
    if (!supabaseReady) return;

    const alertsChannel = supabase
      .channel('global_alerts_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        const newAlert = payload.new;
        
        // Notificação Nativa do Sistema Operacional quando o app está em segundo plano / fechado
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(newAlert.title, {
              body: newAlert.message,
              icon: '/favicon.svg',
              vibrate: userPreferences.vibrationEnabled ? [1000, 500, 1000] : undefined
            });
          } catch (e) {}
        }

        // Ativa a tela de ligação e vibração customizada
        setActiveAlert(newAlert);
        setAlertsHistory((prev) => [newAlert, ...prev]);
      })
      .subscribe();

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
  }, [supabaseReady, currentUser?.id, userPreferences]);

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
          userPreferences={userPreferences}
          onUpdatePreferences={setUserPreferences}
        />
      )}

      {/* Overlay estilo chamada LOMBROU com suporte a preferências do usuário */}
      {activeAlert && (
        <CallAlertOverlay 
          alert={activeAlert} 
          onClose={() => setActiveAlert(null)} 
          userPreferences={userPreferences}
        />
      )}
    </div>
  );
}
