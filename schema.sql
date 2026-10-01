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

-- =========================================================
-- 9. MÓDULO ANEXO: Conflitos Grupo ARCIS (RSC)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.apontamentos_arcis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
    codigo_conflito INTEGER NOT NULL,
    status_arcis VARCHAR(80) NOT NULL DEFAULT 'Aguardando Solução',
    prioridade VARCHAR(30) NOT NULL DEFAULT 'Normal',
    tipo_conflito VARCHAR(100) NOT NULL DEFAULT 'Conflito Normativo',
    disciplina_principal VARCHAR(100) NOT NULL,
    disciplinas_envolvidas TEXT[] DEFAULT '{}',
    edificacao VARCHAR(100) DEFAULT 'TORRE',
    pavimentos TEXT[] DEFAULT '{}',
    local_edificacao TEXT,
    localizacao TEXT,
    descricao TEXT NOT NULL,
    solucao TEXT,
    url_imagem TEXT,
    imagens TEXT[] DEFAULT '{}',
    data_criacao_arcis DATE,
    data_ultima_alteracao DATE,
    numero_relatorio VARCHAR(50)
);

-- Índices de performance para apontamentos_arcis
CREATE INDEX IF NOT EXISTS idx_apontamentos_arcis_projeto ON public.apontamentos_arcis(projeto_id);
CREATE INDEX IF NOT EXISTS idx_apontamentos_arcis_status ON public.apontamentos_arcis(status_arcis);
CREATE INDEX IF NOT EXISTS idx_apontamentos_arcis_codigo ON public.apontamentos_arcis(codigo_conflito);

-- Habilitar RLS na tabela apontamentos_arcis
ALTER TABLE public.apontamentos_arcis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para a tabela apontamentos_arcis
DROP POLICY IF EXISTS "Permitir leitura pública em apontamentos_arcis" ON public.apontamentos_arcis;
DROP POLICY IF EXISTS "Permitir inserção pública em apontamentos_arcis" ON public.apontamentos_arcis;
DROP POLICY IF EXISTS "Permitir atualização pública em apontamentos_arcis" ON public.apontamentos_arcis;
DROP POLICY IF EXISTS "Permitir exclusão pública em apontamentos_arcis" ON public.apontamentos_arcis;

CREATE POLICY "Permitir leitura pública em apontamentos_arcis" ON public.apontamentos_arcis FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública em apontamentos_arcis" ON public.apontamentos_arcis FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública em apontamentos_arcis" ON public.apontamentos_arcis FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública em apontamentos_arcis" ON public.apontamentos_arcis FOR DELETE USING (true);

-- Garantir adição da coluna projeto_id, url_imagem e imagens em tabelas apontamentos_arcis já existentes
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos_arcis' AND column_name = 'projeto_id'
    ) THEN
        ALTER TABLE public.apontamentos_arcis 
        ADD COLUMN projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos_arcis' AND column_name = 'url_imagem'
    ) THEN
        ALTER TABLE public.apontamentos_arcis 
        ADD COLUMN url_imagem TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'apontamentos_arcis' AND column_name = 'imagens'
    ) THEN
        ALTER TABLE public.apontamentos_arcis 
        ADD COLUMN imagens TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Garantir constraint de unicidade por (projeto_id, codigo_conflito) para permitir UPSERT automático e sincronização de relatórios
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_apontamentos_arcis_projeto_codigo'
    ) THEN
        ALTER TABLE public.apontamentos_arcis 
        ADD CONSTRAINT uq_apontamentos_arcis_projeto_codigo 
        UNIQUE (projeto_id, codigo_conflito);
    END IF;
END $$;

-- Relaxar colunas VARCHAR para TEXT em apontamentos_arcis para prevenir erros de overflow (22001)
ALTER TABLE public.apontamentos_arcis 
    ALTER COLUMN status_arcis TYPE TEXT,
    ALTER COLUMN prioridade TYPE TEXT,
    ALTER COLUMN tipo_conflito TYPE TEXT,
    ALTER COLUMN disciplina_principal TYPE TEXT,
    ALTER COLUMN edificacao TYPE TEXT,
    ALTER COLUMN numero_relatorio TYPE TEXT;

-- =========================================================
-- 10. MÓDULO FINANCEIRO: Orçamentos, Contratos e Medições (WCC R01)
-- =========================================================

-- Tabela Obras
CREATE TABLE IF NOT EXISTS public.obras_cad (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cc TEXT,
    codigo TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    endereco TEXT
);

-- Tabela Fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores_cad (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    id_sienge TEXT,
    fornecedor TEXT NOT NULL,
    tipo TEXT
);

-- Tabela Orçamentos Base
CREATE TABLE IF NOT EXISTS public.orcamentos_base (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    obra TEXT NOT NULL,
    nome_obra TEXT,
    disciplina TEXT NOT NULL,
    subdisciplina TEXT NOT NULL,
    orcamento_base NUMERIC(15, 2) NOT NULL DEFAULT 0,
    categoria TEXT NOT NULL DEFAULT 'Projeto' CHECK (categoria IN ('Projeto', 'Legalização')),
    status TEXT NOT NULL DEFAULT 'A contratar'
);

-- Tabela Contratos
CREATE TABLE IF NOT EXISTS public.contratos_obras (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    num_sienge TEXT,
    empresa TEXT NOT NULL,
    obra TEXT NOT NULL,
    disciplina TEXT NOT NULL,
    subdisciplina TEXT NOT NULL,
    valor_contrato NUMERIC(15, 2) NOT NULL DEFAULT 0,
    categoria TEXT NOT NULL DEFAULT 'Projeto' CHECK (categoria IN ('Projeto', 'Legalização'))
);

-- Tabela Medições
CREATE TABLE IF NOT EXISTS public.medicoes_contratos (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    contrato_id TEXT NOT NULL REFERENCES public.contratos_obras(id) ON DELETE CASCADE,
    empresa TEXT NOT NULL,
    obra TEXT NOT NULL,
    etapa TEXT NOT NULL,
    percentual NUMERIC(6, 4) NOT NULL DEFAULT 0,
    data_prevista DATE,
    data_medicao DATE,
    data_referencia DATE,
    mes_competencia TEXT,
    valor_medicao NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'A Medir',
    nf TEXT,
    data_pagamento DATE
);

-- Garantir adição de categoria e colunas estendidas (status, aditivos, distrato)
DO $$
BEGIN
    -- Categoria em orçamentos e contratos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orcamentos_base' AND column_name = 'categoria'
    ) THEN
        ALTER TABLE public.orcamentos_base ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Projeto';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'categoria'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Projeto';
    END IF;

    -- Status em Obras
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'obras_cad' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.obras_cad ADD COLUMN status TEXT DEFAULT 'Ativa';
    END IF;

    -- Campos estendidos em Contratos (Status, Aditivos e Distrato)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN status TEXT DEFAULT 'Ativo';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'valor_original'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN valor_original NUMERIC(15, 2);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'valor_aditivos'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN valor_aditivos NUMERIC(15, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'aditivos'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN aditivos JSONB DEFAULT '[]';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contratos_obras' AND column_name = 'distrato'
    ) THEN
        ALTER TABLE public.contratos_obras ADD COLUMN distrato JSONB;
    END IF;
END $$;

-- Tabela Disciplinas
CREATE TABLE IF NOT EXISTS public.disciplinas_cad (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    codigo TEXT NOT NULL,
    disciplina TEXT NOT NULL
);

-- Tabela Subdisciplinas
CREATE TABLE IF NOT EXISTS public.subdisciplinas_cad (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disciplina TEXT NOT NULL,
    cod_disciplina TEXT NOT NULL,
    subdisciplina TEXT NOT NULL,
    cod_subdisciplina TEXT NOT NULL
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_obra ON public.orcamentos_base(obra);
CREATE INDEX IF NOT EXISTS idx_orcamentos_categoria ON public.orcamentos_base(categoria);
CREATE INDEX IF NOT EXISTS idx_contratos_obra ON public.contratos_obras(obra);
CREATE INDEX IF NOT EXISTS idx_contratos_categoria ON public.contratos_obras(categoria);
CREATE INDEX IF NOT EXISTS idx_contratos_empresa ON public.contratos_obras(empresa);
CREATE INDEX IF NOT EXISTS idx_medicoes_contrato ON public.medicoes_contratos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_medicoes_obra ON public.medicoes_contratos(obra);
CREATE INDEX IF NOT EXISTS idx_medicoes_status ON public.medicoes_contratos(status);

-- RLS
ALTER TABLE public.obras_cad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores_cad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamentos_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicoes_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinas_cad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subdisciplinas_cad ENABLE ROW LEVEL SECURITY;

-- Políticas obras_cad
DROP POLICY IF EXISTS "Permitir leitura pública obras_cad" ON public.obras_cad;
DROP POLICY IF EXISTS "Permitir inserção pública obras_cad" ON public.obras_cad;
DROP POLICY IF EXISTS "Permitir atualização pública obras_cad" ON public.obras_cad;
DROP POLICY IF EXISTS "Permitir exclusão pública obras_cad" ON public.obras_cad;

CREATE POLICY "Permitir leitura pública obras_cad" ON public.obras_cad FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública obras_cad" ON public.obras_cad FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública obras_cad" ON public.obras_cad FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública obras_cad" ON public.obras_cad FOR DELETE USING (true);

-- Políticas fornecedores_cad
DROP POLICY IF EXISTS "Permitir leitura pública fornecedores_cad" ON public.fornecedores_cad;
DROP POLICY IF EXISTS "Permitir inserção pública fornecedores_cad" ON public.fornecedores_cad;
DROP POLICY IF EXISTS "Permitir atualização pública fornecedores_cad" ON public.fornecedores_cad;
DROP POLICY IF EXISTS "Permitir exclusão pública fornecedores_cad" ON public.fornecedores_cad;

CREATE POLICY "Permitir leitura pública fornecedores_cad" ON public.fornecedores_cad FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública fornecedores_cad" ON public.fornecedores_cad FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública fornecedores_cad" ON public.fornecedores_cad FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública fornecedores_cad" ON public.fornecedores_cad FOR DELETE USING (true);

-- Políticas orcamentos_base
DROP POLICY IF EXISTS "Permitir leitura pública orcamentos_base" ON public.orcamentos_base;
DROP POLICY IF EXISTS "Permitir inserção pública orcamentos_base" ON public.orcamentos_base;
DROP POLICY IF EXISTS "Permitir atualização pública orcamentos_base" ON public.orcamentos_base;
DROP POLICY IF EXISTS "Permitir exclusão pública orcamentos_base" ON public.orcamentos_base;

CREATE POLICY "Permitir leitura pública orcamentos_base" ON public.orcamentos_base FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública orcamentos_base" ON public.orcamentos_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública orcamentos_base" ON public.orcamentos_base FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública orcamentos_base" ON public.orcamentos_base FOR DELETE USING (true);

-- Políticas contratos_obras
DROP POLICY IF EXISTS "Permitir leitura pública contratos_obras" ON public.contratos_obras;
DROP POLICY IF EXISTS "Permitir inserção pública contratos_obras" ON public.contratos_obras;
DROP POLICY IF EXISTS "Permitir atualização pública contratos_obras" ON public.contratos_obras;
DROP POLICY IF EXISTS "Permitir exclusão pública contratos_obras" ON public.contratos_obras;

CREATE POLICY "Permitir leitura pública contratos_obras" ON public.contratos_obras FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública contratos_obras" ON public.contratos_obras FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública contratos_obras" ON public.contratos_obras FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública contratos_obras" ON public.contratos_obras FOR DELETE USING (true);

-- Políticas medicoes_contratos
DROP POLICY IF EXISTS "Permitir leitura pública medicoes_contratos" ON public.medicoes_contratos;
DROP POLICY IF EXISTS "Permitir inserção pública medicoes_contratos" ON public.medicoes_contratos;
DROP POLICY IF EXISTS "Permitir atualização pública medicoes_contratos" ON public.medicoes_contratos;
DROP POLICY IF EXISTS "Permitir exclusão pública medicoes_contratos" ON public.medicoes_contratos;

CREATE POLICY "Permitir leitura pública medicoes_contratos" ON public.medicoes_contratos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública medicoes_contratos" ON public.medicoes_contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública medicoes_contratos" ON public.medicoes_contratos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública medicoes_contratos" ON public.medicoes_contratos FOR DELETE USING (true);

-- Políticas disciplinas_cad
DROP POLICY IF EXISTS "Permitir leitura pública disciplinas_cad" ON public.disciplinas_cad;
DROP POLICY IF EXISTS "Permitir inserção pública disciplinas_cad" ON public.disciplinas_cad;
DROP POLICY IF EXISTS "Permitir atualização pública disciplinas_cad" ON public.disciplinas_cad;
DROP POLICY IF EXISTS "Permitir exclusão pública disciplinas_cad" ON public.disciplinas_cad;

CREATE POLICY "Permitir leitura pública disciplinas_cad" ON public.disciplinas_cad FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública disciplinas_cad" ON public.disciplinas_cad FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública disciplinas_cad" ON public.disciplinas_cad FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública disciplinas_cad" ON public.disciplinas_cad FOR DELETE USING (true);

-- Políticas subdisciplinas_cad
DROP POLICY IF EXISTS "Permitir leitura pública subdisciplinas_cad" ON public.subdisciplinas_cad;
DROP POLICY IF EXISTS "Permitir inserção pública subdisciplinas_cad" ON public.subdisciplinas_cad;
DROP POLICY IF EXISTS "Permitir atualização pública subdisciplinas_cad" ON public.subdisciplinas_cad;
DROP POLICY IF EXISTS "Permitir exclusão pública subdisciplinas_cad" ON public.subdisciplinas_cad;

CREATE POLICY "Permitir leitura pública subdisciplinas_cad" ON public.subdisciplinas_cad FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública subdisciplinas_cad" ON public.subdisciplinas_cad FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública subdisciplinas_cad" ON public.subdisciplinas_cad FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública subdisciplinas_cad" ON public.subdisciplinas_cad FOR DELETE USING (true);


