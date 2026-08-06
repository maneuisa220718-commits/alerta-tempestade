-- Script de Migração/Atualização das Colunas da Tabela Profiles

-- 1. Adicionar colunas vulgo, email e password se não existirem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vulgo TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Garantir que as tabelas de posts e messages existam
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  vulgo TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  vulgo TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS em tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir alertas" ON public.alerts;
DROP POLICY IF EXISTS "Permitir posts" ON public.posts;
DROP POLICY IF EXISTS "Permitir messages" ON public.messages;

CREATE POLICY "Permitir profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Permitir alertas" ON public.alerts FOR ALL USING (true);
CREATE POLICY "Permitir posts" ON public.posts FOR ALL USING (true);
CREATE POLICY "Permitir messages" ON public.messages FOR ALL USING (true);
