-- Transformar a conta com vulgo 'maneu' em Administrador Aprovado
UPDATE public.profiles
SET role = 'admin', status = 'aprovado'
WHERE vulgo = 'maneu' OR name = 'maneu' OR email = 'maneu.isa.220718@gmail.com';
