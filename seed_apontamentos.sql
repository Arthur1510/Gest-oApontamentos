-- =========================================================
-- SCRIPT DE INSERÇÃO / SEED DE DADOS DE TESTE NO SUPABASE
-- Adiciona apontamentos com múltiplas imagens e textos longos
-- =========================================================

-- 1. Garante que as colunas existam
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

-- 2. Inserir Apontamentos com Múltiplas Fotos e Textos Longos de Engenharia
INSERT INTO public.apontamentos (
    titulo,
    descricao,
    disciplina_origem,
    disciplina_destino,
    status,
    prioridade,
    tipo_conflito,
    solucao,
    url_imagem,
    url_imagem_solucao,
    imagens_apontamento,
    imagens_solucao
) VALUES 
(
    'Interferência entre Duto de HVAC e Viga Estrutural V-302',
    'Conflito físico crítico detectado no nível 3 (Eixo C-12). O duto principal de exaustão de diâmetro 600mm cruza diretamente a viga estrutural V-302 de altura 70cm.' || CHR(10) || CHR(10) || 'A colisão inviabiliza a montagem da tubulação sem a perfuração da viga ou alteração de cota de fundo de duto. Requer avaliação urgente quanto ao alinhamento do forro acústico hospitalar e impacto na vazão de ar calculada.',
    'Climatização (HVAC)',
    'Estrutura',
    'Aberto',
    'Alta',
    'Conflito Físico',
    'DIRETRIZ DE ENGENHARIA:' || CHR(10) || '1. Alterar a rota do duto com desvio de 45° contornando o bordo esquerdo da viga pelo Eixo C-13.' || CHR(10) || '2. Caso a perda de carga não permita o desvio, executar furação circular de 350mm no centro neutro da viga conforme aprovação do calculista estrutural (ver detalhe no desenho A-402).' || CHR(10) || '3. Rebaixar o forro acartonado em 12cm no trecho do corredor de circulação.',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
    ],
    ARRAY[
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80'
    ]
),
(
    'Passagem de Tubulação Hidráulica na Alvenaria Estrutural',
    'Necessidade de adequação de shaft hidráulico no pavimento tipo (3º ao 18º andar) para evitar rasgos horizontais e cortes desnecessários nos blocos de vedação estrutural.' || CHR(10) || CHR(10) || 'Conforme NBR 15812, não são permitidos cortes horizontais superiores a 40cm na alvenaria de vedação armada.',
    'Hidráulica',
    'Arquitetura',
    'Aberto',
    'Média',
    'Inconsistência Normativa',
    'Ajustar o projeto arquitetônico criando uma carenagem técnica em gesso acartonado (drywall hidráulico RU) de 15cm paralela à parede, permitindo a descida de todas as prumadas sanitárias e de água fria sem rasgos no bloco.',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ARRAY[
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ],
    ARRAY[
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
    ]
);
