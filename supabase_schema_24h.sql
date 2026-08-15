-- Atualização do Schema do Supabase para Feed com Mídia (Fotos/Vídeos) e Auto-Delete após 24 Horas

-- 1. Garantir Tabela de Posts com tipo de mídia (media_type)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  vulgo TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  media_type TEXT DEFAULT 'image', -- 'image' ou 'video'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar colunas media_type se não existirem
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- 2. Função SQL para apagar postagens com mais de 24 horas automaticamente
CREATE OR REPLACE FUNCTION delete_old_posts_24h() RETURNS void AS $$
BEGIN
  DELETE FROM public.posts WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 3. Criar Bucket de Storage do Supabase para Mídias (Maneu Feed Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed_media', 'feed_media', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Liberar Políticas de Leitura/Upload de Mídias no Storage
CREATE POLICY "Permitir upload público de mídia" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'feed_media');
CREATE POLICY "Permitir visualização pública de mídia" ON storage.objects FOR SELECT USING (bucket_id = 'feed_media');
