import React, { useState, useEffect } from 'react';
import { Home, Bell, MessageSquare, Send, Image as ImageIcon, Heart, User, LogOut, Radio, Volume2, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function MobileMainLayout({ user, onLogout, activeAlert, alertsHistory, onSimulateAlert }) {
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' | 'alerta' | 'chat'

  // Feed State
  const [posts, setPosts] = useState([
    { id: 'post_1', vulgo: 'ADM', content: 'Bem-vindos ao aplicativo de alertas! Fiquem atentos às notificações.', created_at: new Date().toISOString() },
    { id: 'post_2', vulgo: 'Carlos', content: 'Qualquer ocorrência ou chuva forte aviso aqui no feed!', created_at: new Date(Date.now() - 3600000).toISOString() }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 'msg_1', vulgo: 'ADM', text: 'Chat da comunidade liberado.', created_at: new Date().toISOString() }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchMessages();

    if (isSupabaseConfigured()) {
      // Listener realtime para o Feed
      const postsSub = supabase
        .channel('public:posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
          setPosts((prev) => [payload.new, ...prev]);
        })
        .subscribe();

      // Listener realtime para o Chat
      const messagesSub = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(postsSub);
        supabase.removeChannel(messagesSub);
      };
    }
  }, []);

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
      vulgo: user.vulgo || 'Anônimo',
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
      vulgo: user.vulgo || 'Anônimo',
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
            <h2 className="user-vulgo-name">@{user.vulgo}</h2>
            <span className="online-tag">● Conectado aos Alertas</span>
          </div>
        </div>
        <button className="btn-icon-logout" onClick={onLogout} title="Sair"><LogOut size={18} /></button>
      </header>

      {/* Conteúdo das Abas (Feed / Alertas / Chat) */}
      <main className="mobile-tab-container">
        
        {/* ABA 1: INÍCIO (FEED COMUNITÁRIO) */}
        {activeTab === 'inicio' && (
          <div className="tab-feed">
            {/* Caixa de Publicação */}
            <div className="glass-card post-box-card">
              <h3>💬 O que está acontecendo?</h3>
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

            {/* Lista de Postagens no Feed */}
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

        {/* ABA 2: ALERTAS (HISTÓRICO E TESTE) */}
        {activeTab === 'alerta' && (
          <div className="tab-alerts">
            <div className="glass-card">
              <h3>🚨 Central de Alertas</h3>
              <p className="sub-text">Historico de notificações de emergência enviadas pelo Administrador.</p>
              
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

        {/* ABA 3: CHAT (BATE-PAPO EM TEMPO REAL) */}
        {activeTab === 'chat' && (
          <div className="tab-chat">
            <div className="glass-card chat-box-card">
              <div className="chat-messages-container">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`chat-message-bubble ${msg.vulgo === user.vulgo ? 'my-message' : 'other-message'}`}
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

      </main>

      {/* MENU NATIVO DO RODAPÉ (FIXO NO CELULAR) */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'inicio' ? 'active' : ''}`}
          onClick={() => setActiveTab('inicio')}
        >
          <Home size={22} />
          <span>Início</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'alerta' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerta')}
        >
          <Bell size={22} />
          <span>Alerta</span>
          {alertsHistory.length > 0 && <span className="nav-badge-count">{alertsHistory.length}</span>}
        </button>

        <button 
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={22} />
          <span>Chat</span>
        </button>
      </nav>
    </div>
  );
}
