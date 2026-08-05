# Script de Inicialização do Banco de Dados Supabase (Postgres)
# Cole este script no SQL Editor do seu projeto Supabase

-- 1. Criar Tabela de Perfis de Usuários e Sala de Espera
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user', -- 'user' ou 'admin'
  status TEXT DEFAULT 'pendente', -- 'pendente', 'aprovado', 'recusado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar Tabela de Alertas Disparados pelo ADM
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency TEXT DEFAULT 'critical', -- 'critical', 'warning', 'info'
  sound TEXT DEFAULT 'siren', -- 'siren', 'call'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Realtime para as tabelas (Para os alertas chegarem instantaneamente no celular)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- 4. Habilitar Row Level Security (RLS) permissivo para demonstração
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública de profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização por admin" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura pública de alertas" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de alertas" ON public.alerts FOR INSERT WITH CHECK (true);
