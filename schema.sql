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
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    pavimentos TEXT[] DEFAULT '{}'
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

-- 4. Criar Tabela 'apontamentos' com tipo_conflito, solucao, url_imagem_solucao, galerias de imagens, pavimento e localizacao
CREATE TABLE IF NOT EXISTS public.apontamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    disciplina_origem VARCHAR(100) NOT NULL,
    disciplina_destino VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Resolvido')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
    tipo_conflito VARCHAR(50) NOT NULL DEFAULT 'Conflito Físico' CHECK (tipo_conflito IN ('Conflito Físico', 'Concepção Técnica', 'Inconsistência Normativa', 'Definição de Produto', 'Informação')),
    solucao TEXT,
    url_imagem TEXT,
    url_imagem_solucao TEXT,
    imagens_apontamento TEXT[] DEFAULT '{}',
    imagens_solucao TEXT[] DEFAULT '{}',
    pavimento TEXT,
    localizacao TEXT,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE
);

-- Garantir adição das colunas em tabelas já existentes
DO $$ 
BEGIN 
    -- Projetos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projetos' AND column_name = 'pavimentos'
    ) THEN
        ALTER TABLE public.projetos 
        ADD COLUMN pavimentos TEXT[] DEFAULT '{}';
    END IF;

    -- Apontamentos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'projeto_id'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'tipo_conflito'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN tipo_conflito VARCHAR(50) NOT NULL DEFAULT 'Conflito Físico';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'solucao'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN solucao TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'url_imagem_solucao'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN url_imagem_solucao TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'imagens_apontamento'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN imagens_apontamento TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'imagens_solucao'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN imagens_solucao TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'pavimento'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN pavimento TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos' AND column_name = 'localizacao'
    ) THEN
        ALTER TABLE public.apontamentos 
        ADD COLUMN localizacao TEXT;
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
