import React, { useState, useEffect } from 'react';
import { Home, Bell, MessageSquare, Send, LogOut, Radio, Shield, Users, Check, X, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function MobileMainLayout({ user, onLogout, activeAlert, alertsHistory, onSimulateAlert }) {
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'alerta' | 'chat' | 'admin'
  const [adminSubTab, setAdminSubTab] = useState('alerta'); // 'alerta' | 'pedidos' | 'usuarios'

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
  const [posts, setPosts] = useState([
    { id: 'post_1', vulgo: 'maneu (ADM)', content: 'Bem-vindos ao aplicativo de alertas! Fiquem atentos às notificações.', created_at: new Date().toISOString() }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 'msg_1', vulgo: 'maneu (ADM)', text: 'Chat da comunidade liberado.', created_at: new Date().toISOString() }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

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

  // Função ao clicar em um dos 10 CARDS do ADM
  const handleTriggerCardAlert = async (card) => {
    setSendingCardId(card.id);
    const lombrouTitle = `LOMBROU ${card.name}`;

    const newAlert = {
      id: 'alert_' + Date.now(),
      title: lombrouTitle,
      message: `ATENÇÃO: ALERTA DISPARADO PARA ${card.name}!`,
      urgency: 'critical',
      sound: 'siren',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('alerts').insert([newAlert]);
      } catch (e) {}
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setIsPosting(true);

    const postObj = {
      id: 'post_' + Date.now(),
      user_id: user.id,
      vulgo: user.vulgo || user.name || 'Anônimo',
      content: newPostContent.trim(),
      image_url: postImageUrl.trim() || null,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').insert([postObj]);
      } catch (e) {}
    }

    setPosts([postObj, ...posts]);
    setNewPostContent('');
    setPostImageUrl('');
    setIsPosting(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const msgObj = {
      id: 'msg_' + Date.now(),
      user_id: user.id,
      vulgo: user.vulgo || user.name || 'Anônimo',
      text: newMessageText.trim(),
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('messages').insert([msgObj]);
      } catch (e) {}
    }

    setMessages([...messages, msgObj]);
    setNewMessageText('');
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
        
        {/* ABA 1: INÍCIO (FEED COMUNITÁRIO) */}
        {activeTab === 'inicio' && (
          <div className="tab-feed">
            <div className="glass-card post-box-card">
              <h3>💬 Feed da Comunidade</h3>
              <form onSubmit={handleCreatePost} className="post-form">
                <textarea 
                  rows="3"
                  placeholder="Escreva seu comentário para todos os usuários..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  className="input-field textarea-field"
                  required
                />
                <div className="post-form-actions">
                  <input 
                    type="url" 
                    placeholder="URL da Imagem (opcional)" 
                    value={postImageUrl} 
                    onChange={e => setPostImageUrl(e.target.value)}
                    className="input-field input-sm"
                  />
                  <button type="submit" className="btn-primary btn-sm" disabled={isPosting}>
                    <Send size={14} /> Postar
                  </button>
                </div>
              </form>
            </div>

            <div className="feed-posts-list">
              {posts.map((post) => (
                <div key={post.id} className="glass-card post-card">
                  <div className="post-card-header">
                    <span className="post-author">@{post.vulgo}</span>
                    <span className="post-time">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="post-content">{post.content}</p>
                  {post.image_url && <img src={post.image_url} alt="post" className="post-attached-image" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: ALERTAS */}
        {activeTab === 'alerta' && (
          <div className="tab-alerts">
            <div className="glass-card">
              <h3>🚨 Central de Alertas</h3>
              <p className="sub-text">Notificações de emergência disparadas pelo ADM.</p>
              
              <div className="test-alert-section">
                <h4>Simular Teste no Celular:</h4>
                <div className="test-buttons-row">
                  <button className="btn-test btn-test-critical" onClick={() => onSimulateAlert('critical')}>
                    <Radio size={16} /> Testar Alarme
                  </button>
                </div>
              </div>
            </div>

            <div className="alerts-feed">
              {alertsHistory.length === 0 ? (
                <div className="glass-card empty-card">
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
                    {a.image_url && <img src={a.image_url} alt="anexo" className="alert-attached-img" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABA 3: CHAT */}
        {activeTab === 'chat' && (
          <div className="tab-chat">
            <div className="glass-card chat-box-card">
              <div className="chat-messages-container">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`chat-message-bubble ${msg.vulgo === (user.vulgo || user.name) ? 'my-message' : 'other-message'}`}
                  >
                    <span className="chat-sender">@{msg.vulgo}</span>
                    <p className="chat-text">{msg.text}</p>
                    <span className="chat-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-form">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem no chat..." 
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  className="input-field"
                  required
                />
                <button type="submit" className="btn-primary btn-chat-send">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ABA 4 EXCLUSIVA: PAINEL ADMIN COM 10 CARDS DE DISPARO RÁPIDO */}
        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="tab-admin">
            
            {/* SUB-MENU DO ADM */}
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

            {/* SEÇÃO 1: GRID DOS 10 CARDS DE ALERTA RÁPIDO */}
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

            {/* SEÇÃO 2: PEDIDOS DE ACESSO */}
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

            {/* SEÇÃO 3: USUÁRIOS APROVADOS */}
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

      {/* MENU NATIVO DO RODAPÉ */}
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
    </div>
  );
}
