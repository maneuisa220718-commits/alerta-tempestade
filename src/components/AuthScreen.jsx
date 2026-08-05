import React, { useState } from 'react';
import { Smartphone, Lock, User, Mail, ArrowRight, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export default function AuthScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  
  // Form Cadastro
  const [regVulgo, setRegVulgo] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  // Form Login
  const [loginVulgo, setLoginVulgo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (regPassword !== regPasswordConfirm) {
      setErrorMessage('As senhas não conferem!');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMessage('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);

    const newUser = {
      vulgo: regVulgo.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: regVulgo.toLowerCase() === 'admin' ? 'admin' : 'user',
      status: regVulgo.toLowerCase() === 'admin' ? 'aprovado' : 'pendente'
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('profiles').insert([newUser]).select();
        if (error) {
          if (error.message.includes('unique') || error.code === '23505') {
            setErrorMessage('Este Vulgo ou Email já está cadastrado!');
          } else {
            setErrorMessage(error.message);
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        setErrorMessage('Erro ao conectar ao banco.');
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSuccessMessage('Cadastro realizado com sucesso! Faça login para continuar.');
    setRegVulgo('');
    setRegEmail('');
    setRegPassword('');
    setRegPasswordConfirm('');
    setMode('login');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const vulgoInput = loginVulgo.trim();
    const passInput = loginPassword;

    // Login ADM de teste rápido
    if (vulgoInput.toLowerCase() === 'admin' && passInput === 'admin123') {
      onLoginSuccess({
        id: 'admin_1',
        vulgo: 'ADMIN',
        role: 'admin',
        status: 'aprovado'
      });
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('vulgo', vulgoInput)
          .eq('password', passInput)
          .single();

        if (error || !data) {
          setErrorMessage('Vulgo ou Senha incorretos!');
          setLoading(false);
          return;
        }

        onLoginSuccess(data);
        return;
      } catch (err) {
        console.log(err);
      }
    }

    // Fallback Mock local para teste rápido sem Supabase
    onLoginSuccess({
      id: 'usr_' + Date.now(),
      vulgo: vulgoInput,
      email: vulgoInput + '@app.com',
      role: vulgoInput.toLowerCase() === 'admin' ? 'admin' : 'user',
      status: vulgoInput.toLowerCase() === 'admin' ? 'aprovado' : 'pendente'
    });
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div className="auth-brand">
          <div className="brand-icon">
            <Smartphone size={40} color="#ff3b30" />
          </div>
          <h1>App de Alerta Mobile</h1>
          <p>Comunidade & Alertas de Emergência</p>
        </div>

        {/* Abas Alternadoras: Login / Cadastro */}
        <div className="auth-mode-toggle">
          <button 
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMessage(''); }}
          >
            <LogIn size={16} /> Entrar (Login)
          </button>
          <button 
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMessage(''); }}
          >
            <UserPlus size={16} /> Cadastrar
          </button>
        </div>

        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        {successMessage && <div className="success-banner"><CheckCircle size={18} /> {successMessage}</div>}

        {mode === 'login' ? (
          /* FORMULÁRIO DE LOGIN (Vulgo e Senha) */
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Vulgo (Nome de Usuário)</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Seu vulgo registrado"
                  value={loginVulgo}
                  onChange={e => setLoginVulgo(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Senha</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="Sua senha"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'ENTRANDO...' : <>ENTRAR <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          /* FORMULÁRIO DE CADASTRO (Vulgo, Email, Senha, Confirmação) */
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Vulgo (Como quer ser chamado)</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Ex: Maneu, Tubarão, etc."
                  value={regVulgo}
                  onChange={e => setRegVulgo(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="seuemail@exemplo.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Senha</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="Crie sua senha"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirmação de Senha</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="Digite a senha novamente"
                  value={regPasswordConfirm}
                  onChange={e => setRegPasswordConfirm(e.target.value)}
                  className="input-field with-icon"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
              {loading ? 'CADASTRANDO...' : <>FINALIZAR CADASTRO <ArrowRight size={18} /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
