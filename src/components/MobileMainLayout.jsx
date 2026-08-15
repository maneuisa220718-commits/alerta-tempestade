import React, { useState, useEffect } from 'react';
import { Home, Bell, MessageSquare, Send, LogOut, Radio, Shield, Users, Check, X, RefreshCw, AlertTriangle, Zap, Volume2, Smartphone, Image as ImageIcon, Settings, Camera } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function MobileMainLayout({ user, onLogout, activeAlert, alertsHistory, onSimulateAlert, userPreferences, onUpdatePreferences }) {
  const [activeTab, setActiveTab] = useState('inicio');
  const [adminSubTab, setAdminSubTab] = useState('alerta');

  // Estados de Upload de Mídia (Foto ou Vídeo até 1 minuto)
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [fileError, setFileError] = useState('');

  // Preferências do usuário para Notificações de Alerta
  const [soundEnabled, setSoundEnabled] = useState(userPreferences?.soundEnabled ?? true);
  const [vibrationEnabled, setVibrationEnabled] = useState(userPreferences?.vibrationEnabled ?? true);
  const [imageEnabled, setImageEnabled] = useState(userPreferences?.imageEnabled ?? true);
  const [pushPermissionStatus, setPushPermissionStatus] = useState('default');

  const handleFileSelect = (e) => {
    setFileError('');
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 60) {
          setFileError('⚠️ O vídeo deve ter no máximo 1 minuto (60 segundos).');
          setSelectedFile(null);
        } else {
          setSelectedFile(file);
          setMediaType('video');
        }
      };
      videoElement.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(file);
      setMediaType('image');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedFile) return;
    setIsPosting(true);

    let mediaUrl = postImageUrl.trim() || null;

    // Se o ADM selecionou um arquivo local (Foto ou Vídeo da câmera/galeria), faz upload para o Supabase Storage
    if (selectedFile && isSupabaseConfigured()) {
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed_media')
          .upload(fileName, selectedFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('feed_media').getPublicUrl(fileName);
          if (urlData) mediaUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('Erro no upload de mídia:', err);
      }
    }

    const postObj = {
      vulgo: user.vulgo || user.name || 'Anônimo',
      content: newPostContent.trim(),
      image_url: mediaUrl,
      media_type: mediaType
    };

    if (user.id && !user.id.startsWith('admin_') && !user.id.startsWith('usr_')) {
      postObj.user_id = user.id;
    }

    if (isSupabaseConfigured()) {
      try {
        const { error: postError } = await supabase.from('posts').insert([postObj]);
        if (postError) {
          console.error('Erro no Supabase ao postar:', postError);
        }
      } catch (e) {
        console.error('Erro ao salvar post:', e);
      }
      // Atualiza o Feed buscando direto do banco após postar
      await fetchPosts();
    } else {
      // Fallback local sem Supabase
      setPosts(prev => [{ ...postObj, id: 'local_' + Date.now(), created_at: new Date().toISOString() }, ...prev]);
    }

    setNewPostContent('');
    setPostImageUrl('');
    setSelectedFile(null);
    setIsPosting(false);
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission);
    }
  }, []);

  const handleTogglePreference = (key, val) => {
    const updated = {
      soundEnabled: key === 'sound' ? val : soundEnabled,
      vibrationEnabled: key === 'vibration' ? val : vibrationEnabled,
      imageEnabled: key === 'image' ? val : imageEnabled,
    };
    if (key === 'sound') setSoundEnabled(val);
    if (key === 'vibration') setVibrationEnabled(val);
    if (key === 'image') setImageEnabled(val);

    if (onUpdatePreferences) {
      onUpdatePreferences(updated);
    }
  };

  const handleRequestPushPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPushPermissionStatus(perm);
      if (perm === 'granted') {
        alert('Notificações nativas ativadas! O celular receberá alertas do ADM mesmo com a tela bloqueada ou app em segundo plano.');
      }
    }
  };

  // Lista dos 10 Cards Rápidos do ADM
  const ALERT_CARDS = [
    { id: 'fundao', name: 'FUNDAO' },
    { id: 'entradao', name: 'ENTRADAO' },
    { id: 'costa', name: 'COSTA' },
    { id: 'cinco_mais_um', name: '5+1' },
    { id: 'udm', name: 'UDM' },
    { id: 'rua_nova', name: 'RUA NOVA' },
    { id: 'rua_da_igreja', name: 'RUA DA IGREJA' },
    { id: 'quadra_do_gelo', name: 'QUADRA DO GELO' },
    { id: 'firma_do_gelo', name: 'FIRMA DO GELO' },
    { id: 'quatro_ponto_cinco', name: '4.5' }
  ];

  // Admin Management State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);

  // State para envio por Card
  const [sendingCardId, setSendingCardId] = useState(null);
  const [alertSentSuccess, setAlertSentSuccess] = useState(false);
  const [lastSentTitle, setLastSentTitle] = useState('');

  // Feed State
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const [chatMediaType, setChatMediaType] = useState('image');
  const [chatFileError, setChatFileError] = useState('');
  const chatEndRef = React.useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchMessages();

    if (user.role === 'admin') {
      fetchUsersForAdmin();
    }

    if (isSupabaseConfigured()) {
      const postsSub = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        })
        .subscribe();

      const messagesSub = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      const profilesSub = supabase
        .channel('public:profiles_admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          if (user.role === 'admin') fetchUsersForAdmin();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(postsSub);
        supabase.removeChannel(messagesSub);
        supabase.removeChannel(profilesSub);
      };
    }
  }, [user]);

  // Auto-scroll para última mensagem do chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchUsersForAdmin = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) {
        setPendingUsers(data.filter(u => u.status === 'pendente'));
        setApprovedUsers(data.filter(u => u.status === 'aprovado'));
      }
    } catch (e) {}
  };

  const handleApproveUser = async (userId) => {
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ status: 'aprovado' }).eq('id', userId);
    }
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    fetchUsersForAdmin();
  };

  const handleRejectUser = async (userId) => {
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ status: 'recusado' }).eq('id', userId);
    }
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    fetchUsersForAdmin();
  };

  const handleTriggerCardAlert = async (card) => {
    setSendingCardId(card.id);
    const lombrouTitle = `LOMBROU ${card.name}`;

    const newAlert = {
      title: lombrouTitle,
      message: `ATENÇÃO: ALERTA DISPARADO PARA ${card.name}!`,
      urgency: 'critical',
      sound: 'siren'
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('alerts').insert([newAlert]);
        if (error) console.error('Erro ao enviar alerta:', error);
      } catch (e) {
        console.error(e);
      }
    }

    setSendingCardId(null);
    setLastSentTitle(lombrouTitle);
    setAlertSentSuccess(true);
    setTimeout(() => setAlertSentSuccess(false), 3000);
  };

  const fetchPosts = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) setPosts(data);
    } catch (e) {}
  };

  const fetchMessages = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) setMessages(data);
    } catch (e) {}
  };


  const handleChatFileSelect = (file) => {
    if (!file) return;
    setChatFileError('');
    if (file.type.startsWith('video/')) {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => {
        window.URL.revokeObjectURL(vid.src);
        if (vid.duration > 60) {
          setChatFileError('⚠️ Vídeo deve ter no máximo 1 minuto.');
          setChatFile(null);
        } else {
          setChatFile(file);
          setChatMediaType('video');
        }
      };
      vid.src = URL.createObjectURL(file);
    } else {
      setChatFile(file);
      setChatMediaType('image');
    }
  };

  const handleChatCamera = (e) => handleChatFileSelect(e.target.files[0]);
  const handleChatGallery = (e) => handleChatFileSelect(e.target.files[0]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() && !chatFile) return;

    let mediaUrl = null;
    let mediaType = chatMediaType;

    if (chatFile && isSupabaseConfigured()) {
      try {
        const ext = chatFile.name.split('.').pop();
        const fileName = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const { data: up, error: upErr } = await supabase.storage.from('feed_media').upload(fileName, chatFile);
        if (!upErr && up) {
          const { data: urlData } = supabase.storage.from('feed_media').getPublicUrl(fileName);
          if (urlData) mediaUrl = urlData.publicUrl;
        }
      } catch (err) { console.error('Erro upload chat mídia:', err); }
    }

    const msgObj = {
      vulgo: user.vulgo || user.name || 'Anônimo',
      text: newMessageText.trim() || '',
      image_url: mediaUrl,
      media_type: mediaType
    };

    if (user.id && !user.id.startsWith('admin_') && !user.id.startsWith('usr_')) {
      msgObj.user_id = user.id;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').insert([msgObj]);
      } catch (err) { console.error('Erro ao enviar mensagem:', err); }
    } else {
      setMessages(prev => [...prev, { ...msgObj, id: 'local_' + Date.now(), created_at: new Date().toISOString() }]);
    }

    setNewMessageText('');
    setChatFile(null);
    setChatFileError('');
  };

  return (
    <div className="mobile-app-layout">
      {/* Topo do App */}
      <header className="mobile-header glass-card">
        <div className="user-header-info">
          <div className="user-avatar-badge">{user.vulgo ? user.vulgo.charAt(0).toUpperCase() : 'U'}</div>
          <div>
            <h2 className="user-vulgo-name">
              @{user.vulgo || user.name} {user.role === 'admin' && <span className="admin-tag">ADM</span>}
            </h2>
            <span className="online-tag">● Conectado aos Alertas</span>
          </div>
        </div>
        <button className="btn-icon-logout" onClick={onLogout} title="Sair"><LogOut size={18} /></button>
      </header>

      {/* Conteúdo Principal */}
      <main className="mobile-tab-container">
        
        {/* ABA 1: INÍCIO (FEED INFORMATIVO DO ADM - VÁLIDO POR 24 HORAS) */}
        {activeTab === 'inicio' && (
          <div className="tab-feed">
            {/* Caixa de Publicação Exclusiva do ADM com Foto/Vídeo */}
            {user.role === 'admin' ? (
              <div className="glass-card post-box-card">
                <h3>📣 Publicar no Feed (Válido por 24h)</h3>
                <form onSubmit={handleCreatePost} className="post-form">
                  <textarea 
                    rows="3"
                    placeholder="Escreva um comunicado..."
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    className="input-field textarea-field"
                    required
                  />
                  
                  {/* Seletor de Câmera / Arquivo (Fotos ou Vídeos até 60s) */}
                  <div className="media-selector-area">
                    <label htmlFor="media-upload-input" className="btn-camera-upload">
                      <Camera size={18} />
                      <span>{selectedFile ? selectedFile.name : 'Tirar Foto ou Escolher Vídeo (Máx 1 min)'}</span>
                    </label>
                    <input 
                      id="media-upload-input"
                      type="file" 
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {fileError && <p className="field-hint" style={{ color: '#ff3b30' }}>{fileError}</p>}

                  <div className="post-form-actions" style={{ justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                    <button type="submit" className="btn-primary btn-sm" disabled={isPosting}>
                      <Send size={14} /> {isPosting ? 'PUBLICANDO...' : 'Publicar'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="glass-card post-box-card" style={{ padding: '0.9rem 1rem' }}>
                <h3 style={{ fontSize: '0.85rem', color: '#9ca3af' }}>📌 Comunicados Oficiais do ADM (Apagados em 24h)</h3>
              </div>
            )}

            {/* LISTA DE POSTS DO FEED (FILTRADOS AUTOMATICAMENTE APENAS OS DAS ÚLTIMAS 24 HORAS) */}
            <div className="feed-posts-list">
              {posts.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 86400000).map((post) => (
                <div key={post.id} className="glass-card post-card">
                  <div className="post-card-header">
                    <span className="post-author">@{post.vulgo}</span>
                    <span className="post-time">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="post-content">{post.content}</p>

                  {/* Renderização condicional: Vídeo ou Imagem */}
                  {post.image_url && (
                    post.media_type === 'video' ? (
                      <video src={post.image_url} controls className="post-attached-video" style={{ width: '100%', borderRadius: '12px', marginTop: '0.5rem', maxHeight: '280px' }} />
                    ) : (
                      <img src={post.image_url} alt="post" className="post-attached-image" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: ALERTAS E CONFIGURAÇÕES PERSONALIZADAS DE NOTIFICAÇÃO */}
        {activeTab === 'alerta' && (
          <div className="tab-alerts">
            
            {/* PAINEL DE CONTROLE DE PREFERÊNCIAS DO USUÁRIO */}
            <div className="glass-card prefs-card">
              <h3><Settings size={20} color="#ff3b30" /> Preferências de Notificação</h3>
              <p className="sub-text">Escolha como você deseja ser notificado quando o ADM disparar um alerta:</p>

              <div className="prefs-switches-list">
                {/* Permissão Nativa Push Celular Fechado */}
                <div className="pref-item pref-item-highlight">
                  <div className="pref-info">
                    <Bell size={20} color="#007aff" />
                    <div>
                      <strong>Notificação com App Fechado</strong>
                      <p>Receba o alarme no celular mesmo com a tela desligada ou app fechado.</p>
                    </div>
                  </div>
                  {pushPermissionStatus === 'granted' ? (
                    <span className="badge badge-approved"><Check size={14} /> Ativo</span>
                  ) : (
                    <button className="btn-primary btn-sm" onClick={handleRequestPushPermission}>
                      ATIVAR
                    </button>
                  )}
                </div>

                {/* Opção 1: Som do Alarme */}
                <div className="pref-item">
                  <div className="pref-info">
                    <Volume2 size={20} color="#ff3b30" />
                    <div>
                      <strong>Som de Alarme / Sirene</strong>
                      <p>Tocar efeito sonoro de emergência</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled} 
                      onChange={e => handleTogglePreference('sound', e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Opção 2: Vibração Contínua */}
                <div className="pref-item">
                  <div className="pref-info">
                    <Smartphone size={20} color="#ffcc00" />
                    <div>
                      <strong>Vibração do Telefone</strong>
                      <p>Vibrar o celular continuamente</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={vibrationEnabled} 
                      onChange={e => handleTogglePreference('vibration', e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* Opção 3: Imagem do Alerta */}
                <div className="pref-item">
                  <div className="pref-info">
                    <ImageIcon size={20} color="#34c759" />
                    <div>
                      <strong>Exibir Imagem do Alerta</strong>
                      <p>Carregar imagens enviadas pelo ADM</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={imageEnabled} 
                      onChange={e => handleTogglePreference('image', e.target.checked)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* HISTÓRICO DE ALERTAS RECEBIDOS */}
            <div className="alerts-feed" style={{ marginTop: '1rem' }}>
              <h3>🚨 Histórico de Alertas</h3>
              {alertsHistory.length === 0 ? (
                <div className="glass-card empty-card" style={{ marginTop: '0.5rem' }}>
                  <p>Nenhum alerta enviado pelo ADM até o momento.</p>
                </div>
              ) : (
                alertsHistory.map((a) => (
                  <div key={a.id} className={`glass-card alert-item-card urgency-${a.urgency}`}>
                    <div className="alert-item-header">
                      <h4>{a.title}</h4>
                      <span>{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p>{a.message}</p>
                    {imageEnabled && a.image_url && <img src={a.image_url} alt="anexo" className="alert-attached-img" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 3: CHAT EM GRUPO EM TELA CHEIA */}
        {activeTab === 'chat' && (
          <div className="tab-chat-fullscreen">
            {/* Header do Chat com seta de voltar */}
            <div className="chat-fullscreen-header">
              <button className="chat-back-btn" onClick={() => setActiveTab('inicio')}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="chat-header-info">
                <div className="chat-header-avatar">G</div>
                <div>
                  <p className="chat-header-name">Grupo Geral</p>
                  <p className="chat-header-sub">{messages.filter(m => (Date.now() - new Date(m.created_at).getTime()) < 86400000).length} mensagens · <span style={{color:'#34c759'}}>Ao vivo</span></p>
                </div>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="chat-messages-scroll">
              {messages
                .filter(m => (Date.now() - new Date(m.created_at).getTime()) < 86400000)
                .map((msg, idx) => {
                  const isMe = msg.vulgo === (user.vulgo || user.name);
                  return (
                    <div key={msg.id || idx} className={`chat-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
                      {!isMe && <span className="chat-bubble-name">@{msg.vulgo}</span>}
                      <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                        {msg.text && <p className="bubble-text">{msg.text}</p>}
                        {msg.image_url && (
                          msg.media_type === 'video'
                            ? <video src={msg.image_url} controls className="bubble-media" />
                            : <img src={msg.image_url} alt="mídia" className="bubble-media" />
                        )}
                        <span className="bubble-time">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              }
              <div ref={chatEndRef} />
            </div>

            {/* Barra de Input do Chat */}
            <div className="chat-input-area">
              {chatFileError && <p style={{ color: '#ff3b30', fontSize: '0.73rem', padding: '0 0.8rem 0.2rem' }}>{chatFileError}</p>}
              {chatFile && (
                <p style={{ color: '#60a5fa', fontSize: '0.73rem', padding: '0 0.8rem 0.2rem' }}>
                  📎 {chatFile.name}
                </p>
              )}
              <form onSubmit={handleSendMessage} className="chat-input-form">

                {/* Botão Câmera: Abre diretamente a câmera do celular */}
                <label htmlFor="chat-camera-input" className="chat-camera-btn" title="Tirar foto agora">
                  <Camera size={20} />
                </label>
                <input
                  id="chat-camera-input"
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleChatCamera}
                  style={{ display: 'none' }}
                />

                {/* Botão Galeria: Escolher foto/vídeo existente */}
                <label htmlFor="chat-gallery-input" className="chat-gallery-btn" title="Escolher da galeria">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </label>
                <input
                  id="chat-gallery-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleChatGallery}
                  style={{ display: 'none' }}
                />

                <input
                  type="text"
                  placeholder="Mensagem para o grupo..."
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  className="input-field chat-text-input"
                />
                <button type="submit" className="btn-primary chat-send-btn">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA 4 EXCLUSIVA: PAINEL ADMIN */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="tab-admin">
            
            <div className="admin-sub-menu">
              <button 
                className={`admin-sub-btn ${adminSubTab === 'alerta' ? 'active' : ''}`}
                onClick={() => setAdminSubTab('alerta')}
              >
                <Zap size={16} /> Disparar Cards
              </button>
              <button 
                className={`admin-sub-btn ${adminSubTab === 'pedidos' ? 'active' : ''}`}
                onClick={() => setAdminSubTab('pedidos')}
              >
                <Users size={16} /> Pedidos ({pendingUsers.length})
              </button>
              <button 
                className={`admin-sub-btn ${adminSubTab === 'usuarios' ? 'active' : ''}`}
                onClick={() => setAdminSubTab('usuarios')}
              >
                <Shield size={16} /> Aprovados ({approvedUsers.length})
              </button>
            </div>

            {adminSubTab === 'alerta' && (
              <div className="glass-card">
                <div className="card-disparar-header">
                  <h3>🚨 Disparo Rápido por Card</h3>
                  <p className="sub-text">Clique no card para tocar e piscar a tela dos usuários liberados.</p>
                </div>

                {alertSentSuccess && (
                  <div className="success-banner-lombrou">
                    <Check size={20} /> <strong>{lastSentTitle}</strong> DISPARADO COM SUCESSO!
                  </div>
                )}

                <div className="cards-grid-admin">
                  {ALERT_CARDS.map((card) => (
                    <button
                      key={card.id}
                      className={`alert-card-btn ${sendingCardId === card.id ? 'sending' : ''}`}
                      onClick={() => handleTriggerCardAlert(card)}
                      disabled={sendingCardId === card.id}
                    >
                      <div className="alert-card-icon">
                        <AlertTriangle size={22} color="#ff3b30" />
                      </div>
                      <span className="alert-card-name">{card.name}</span>
                      <span className="alert-card-sub">DISPARAR</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {adminSubTab === 'pedidos' && (
              <div className="glass-card">
                <div className="tab-header-flex">
                  <h3>👥 Solicitações Pendentes ({pendingUsers.length})</h3>
                  <button className="btn-icon" onClick={fetchUsersForAdmin} title="Atualizar"><RefreshCw size={16} /></button>
                </div>

                {pendingUsers.length === 0 ? (
                  <div className="empty-card" style={{ padding: '1.5rem 0', textCenter: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Nenhum usuário aguardando na Sala de Espera.</p>
                  </div>
                ) : (
                  <div className="users-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                    {pendingUsers.map((pUser) => (
                      <div key={pUser.id} className="user-card pending-card">
                        <div className="user-info">
                          <h4>@{pUser.vulgo || pUser.name}</h4>
                          <p>{pUser.email}</p>
                          <span className="badge badge-pending">Pendente</span>
                        </div>
                        <div className="user-actions">
                          <button className="btn-action btn-approve" onClick={() => handleApproveUser(pUser.id)}>
                            <Check size={14} /> Autorizar
                          </button>
                          <button className="btn-action btn-reject" onClick={() => handleRejectUser(pUser.id)}>
                            <X size={14} /> Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminSubTab === 'usuarios' && (
              <div className="glass-card">
                <h3>🛡️ Usuários com Acesso Liberado ({approvedUsers.length})</h3>
                <div className="users-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
                  {approvedUsers.map((aUser) => (
                    <div key={aUser.id} className="user-card approved-card">
                      <div className="user-info">
                        <h4>@{aUser.vulgo || aUser.name} {aUser.role === 'admin' && '(ADM)'}</h4>
                        <p>{aUser.email}</p>
                        <span className="badge badge-approved">Acesso Ativo</span>
                      </div>
                      {aUser.role !== 'admin' && (
                        <button className="btn-action btn-reject" onClick={() => handleRejectUser(aUser.id)}>
                          Bloquear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* MENU DO RODAPé: oculto quando estiver no chat em tela cheia */}
      {activeTab !== 'chat' && (
        <nav className="mobile-bottom-nav">
          <button 
            className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
            onClick={() => setActiveTab('inicio')}
          >
            <Home size={20} />
            <span>Início</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'alerta' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerta')}
          >
            <Bell size={20} />
            <span>Alerta</span>
            {alertsHistory.length > 0 && <span className="nav-badge-count">{alertsHistory.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={20} />
            <span>Chat</span>
          </button>

          {user.role === 'admin' && (
            <button 
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield size={20} color="#ff3b30" />
              <span style={{ color: '#ff3b30' }}>Painel ADM</span>
              {pendingUsers.length > 0 && <span className="nav-badge-count">{pendingUsers.length}</span>}
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
