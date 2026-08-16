-- =========================================================
-- SCHEMA SQL RELACIONAL (Projetos & Apontamentos)
-- Idempotente: Pode ser executado múltiplas vezes sem erros
-- =========================================================

-- 1. Criar Tabela 'projetos'
CREATE TABLE IF NOT EXISTS public.projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

-- 2. Habilitar RLS na tabela projetos
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para a tabela projetos
DROP POLICY IF EXISTS "Permitir leitura pública em projetos" ON public.projetos;
DROP POLICY IF EXISTS "Permitir inserção pública em projetos" ON public.projetos;
DROP POLICY IF EXISTS "Permitir atualização pública em projetos" ON public.projetos;
DROP POLICY IF EXISTS "Permitir exclusão pública em projetos" ON public.projetos;

CREATE POLICY "Permitir leitura pública em projetos" ON public.projetos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em projetos" ON public.projetos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em projetos" ON public.projetos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública em projetos" ON public.projetos FOR DELETE USING (true);

-- 4. Criar Tabela 'apontamentos' com Chave Estrangeira (projeto_id)
CREATE TABLE IF NOT EXISTS public.apontamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    disciplina_origem VARCHAR(100) NOT NULL,
    disciplina_destino VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Resolvido')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
    url_imagem TEXT,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE
);

-- Adicionar a coluna projeto_id se a tabela já existia sem ela
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'projeto_id'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Habilitar RLS na tabela apontamentos
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para a tabela apontamentos
DROP POLICY IF EXISTS "Permitir leitura pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir atualização pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.apontamentos;

CREATE POLICY "Permitir leitura pública" ON public.apontamentos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.apontamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.apontamentos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.apontamentos FOR DELETE USING (true);

-- 7. Criar o Bucket 'clashes' no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clashes', 'clashes', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Políticas para o Bucket 'clashes' no Storage
DROP POLICY IF EXISTS "Permitir leitura pública de imagens no bucket clashes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload público no bucket clashes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão pública no bucket clashes" ON storage.objects;

CREATE POLICY "Permitir leitura pública de imagens no bucket clashes" ON storage.objects FOR SELECT USING (bucket_id = 'clashes');
CREATE POLICY "Permitir upload público no bucket clashes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clashes');
CREATE POLICY "Permitir exclusão pública no bucket clashes" ON storage.objects FOR DELETE USING (bucket_id = 'clashes');

-- 9. Seed Inicial de Projetos (Exemplo)
INSERT INTO public.projetos (id, nome, descricao, status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Hospital Central - Bloco A', 'Projeto de compatibilização das instalações hospitalares e estrutura do Bloco A.', 'Ativo'),
    ('22222222-2222-2222-2222-222222222222', 'Edifício Residencial Horizonte', 'Torre residencial com 25 pavimentos e subsolo de estacionamento.', 'Ativo')
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Inicial de Apontamentos vinculados aos Projetos
INSERT INTO public.apontamentos (titulo, descricao, disciplina_origem, disciplina_destino, status, prioridade, url_imagem, projeto_id)
VALUES 
    (
        'Interferência entre Duto de HVAC e Viga Metálica', 
        'Conflito detectado no nível 3 (Eixo C-12). O duto principal de exaustão cruza diretamente a viga estrutural V-302.', 
        'Climatização (HVAC)', 
        'Estrutura', 
        'Aberto', 
        'Alta', 
        'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'Passagem de Tubulação Hidráulica na Alvenaria Estrutural', 
        'Necessidade de adequação de shaft hidráulico no pavimento tipo para evitar corte em bloco estrutural.', 
        'Hidráulica', 
        'Arquitetura', 
        'Aberto', 
        'Média', 
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        '22222222-2222-2222-2222-222222222222'
    )
ON CONFLICT (id) DO NOTHING;
