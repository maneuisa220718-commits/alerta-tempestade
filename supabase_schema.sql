-- 1. Criar Tabela de Perfis de Usuários (com Vulgo, Email, Senha, Role e Status)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vulgo TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'user' ou 'admin'
  status TEXT DEFAULT 'pendente', -- 'pendente', 'aprovado', 'recusado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar Tabela de Alertas (Enviados apenas pelo ADM)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency TEXT DEFAULT 'critical', -- 'critical', 'warning', 'info'
  sound TEXT DEFAULT 'siren',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar Tabela do Feed Comunitário (Postagens dos Usuários)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  vulgo TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criar Tabela de Chat Geral
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  vulgo TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar Realtime para todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 6. Liberar Políticas de Acesso
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura de alertas" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de alertas" ON public.alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de posts" ON public.posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de messages" ON public.messages FOR INSERT WITH CHECK (true);
