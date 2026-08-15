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
  // 1. PERSISTÊNCIA DE LOGIN NO LOCALSTORAGE (O login não sai mais ao atualizar a página)
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('app_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeAlert, setActiveAlert] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  
  const [userPreferences, setUserPreferences] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    imageEnabled: true
  });

  const supabaseReady = isSupabaseConfigured();

  // Salva o perfil logado no localStorage sempre que mudar
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, async (payload) => {
        const newAlert = payload.new;
        const alertImg = newAlert.image_url || 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80';
        
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker?.getRegistration();
            if (reg && reg.showNotification) {
              reg.showNotification(newAlert.title || '🚨 LOMBROU ALERTA', {
                body: newAlert.message || 'ATENÇÃO: ALERTA DE EMERGÊNCIA DISPARADO!',
                icon: 'https://cdn-icons-png.flaticon.com/512/1011/1011863.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/1011/1011863.png',
                image: userPreferences.imageEnabled ? alertImg : undefined,
                vibrate: userPreferences.vibrationEnabled ? [1000, 300, 1000, 300, 1000, 300, 1000] : undefined,
                tag: 'lombrou-alert-v3',
                renotify: true,
                requireInteraction: true,
                data: { url: window.location.origin }
              });
            } else {
              new Notification(newAlert.title || '🚨 LOMBROU ALERTA', {
                body: newAlert.message,
                icon: 'https://cdn-icons-png.flaticon.com/512/1011/1011863.png',
                image: userPreferences.imageEnabled ? alertImg : undefined,
                vibrate: userPreferences.vibrationEnabled ? [1000, 300, 1000, 300, 1000, 300, 1000] : undefined
              });
            }
          } catch (e) {
            console.error('Erro notificação nativa:', e);
          }
        }

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
    localStorage.removeItem('app_current_user');
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

      <PWAInstallPrompt />

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
