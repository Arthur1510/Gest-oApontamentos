import { createClient } from '@supabase/supabase-js';
import { Apontamento, Projeto } from '@/types/apontamento';
import { compressImage } from '@/lib/image-compression';

// Configuração do Supabase Client usando variáveis de ambiente do Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Função auxiliar para verificar se o Supabase foi devidamente configurado
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
      supabaseAnonKey !== 'your-anon-key'
  );
};

export const isForceMockMode = (): boolean => {
  return !isSupabaseConfigured();
};

// Instância única do cliente Supabase (ou null se não configurado)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Função utilitária para fazer upload de imagens diretamente para o bucket 'clashes' com otimização WebP
export const uploadImageToClashesBucket = async (file: File): Promise<string> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase não está configurado. Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local.');
  }

  // 1. Otimiza e converte automaticamente a imagem para WebP no cliente antes do upload
  const optimizedFile = await compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.82,
    format: 'image/webp',
  });

  // 2. Gera um nome único para o arquivo usando timestamp e extensão WebP
  const fileExt = optimizedFile.name.split('.').pop() || 'webp';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('clashes')
    .upload(filePath, optimizedFile, {
      cacheControl: '31536000', // 1 ano de cache para economia de banda
      upsert: false,
      contentType: optimizedFile.type || 'image/webp',
    });

  if (uploadError) {
    console.error('Erro no upload para o Supabase Storage:', uploadError);
    throw new Error(`Falha no upload para o bucket 'clashes': ${uploadError.message}. Certifique-se de que o bucket 'clashes' foi criado e possui políticas de acesso público.`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('clashes')
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem enviada.');
  }

  return publicUrlData.publicUrl;
};

// Mock data de Projetos
export const MOCK_PROJETOS: Projeto[] = [
  {
    id: 'proj-1',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    nome: 'Hospital Central - Bloco A',
    descricao: 'Compatibilização de sistemas críticos hospitalares, estrutura e HVAC.',
    status: 'Ativo',
  },
  {
    id: 'proj-2',
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    nome: 'Edifício Residencial Horizonte',
    descricao: 'Empreendimento residencial com 25 pavimentos e 2 subsolos de garagem.',
    status: 'Ativo',
  },
  {
    id: 'proj-3',
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    nome: 'Centro Logístico Eixo Sul',
    descricao: 'Galpão industrial e pátio de manobras com cobertura metálica.',
    status: 'Inativo',
  },
];

// Mock data de Apontamentos com Múltiplas Imagens e Textos Longos para testes
export const MOCK_APONTAMENTOS: Apontamento[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    titulo: 'Interferência entre Duto de HVAC e Viga Estrutural V-302',
    descricao: 'Conflito físico crítico detectado no nível 3 (Eixo C-12). O duto principal de exaustão de diâmetro 600mm cruza diretamente a viga estrutural V-302 de altura 70cm.\n\nA colisão inviabiliza a montagem da tubulação sem a perfuração da viga ou alteração de cota de fundo de duto. Requer avaliação urgente quanto ao alinhamento do forro acústico hospitalar e impacto na vazão de ar calculada.',
    disciplina_origem: 'Climatização (HVAC)',
    disciplina_destino: 'Estrutura',
    status: 'Aberto',
    prioridade: 'Alta',
    tipo_conflito: 'Conflito Físico',
    solucao: 'DIRETRIZ DE ENGENHARIA:\n1. Alterar a rota do duto com desvio de 45° contornando o bordo esquerdo da viga pelo Eixo C-13.\n2. Caso a perda de carga não permita o desvio, executar furação circular de 350mm no centro neutro da viga conforme aprovação do calculista estrutural (ver detalhe no desenho de armação A-402).\n3. Rebaixar o forro acartonado em 12cm no trecho do corredor de circulação.',
    url_imagem: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    url_imagem_solucao: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    imagens_apontamento: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ],
    imagens_solucao: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    ],
    projeto_id: 'proj-1',
    projetos: { nome: 'Hospital Central - Bloco A' },
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    titulo: 'Passagem de Tubulação Hidráulica na Alvenaria Estrutural',
    descricao: 'Necessidade de adequação de shaft hidráulico no pavimento tipo (3º ao 18º andar) para evitar rasgos horizontais e cortes desnecessários nos blocos de vedação estrutural.\n\nConforme NBR 15812, não são permitidos cortes horizontais superiores a 40cm na alvenaria de vedação armada.',
    disciplina_origem: 'Hidráulica',
    disciplina_destino: 'Arquitetura',
    status: 'Aberto',
    prioridade: 'Média',
    tipo_conflito: 'Inconsistência Normativa',
    solucao: 'Ajustar o projeto arquitetônico criando uma carenagem técnica em gesso acartonado (drywall hidráulico RU) de 15cm paralela à parede, permitindo a descida de todas as prumadas sanitárias e de água fria sem rasgos no bloco.',
    url_imagem: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    url_imagem_solucao: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    imagens_apontamento: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    imagens_solucao: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ],
    projeto_id: 'proj-2',
    projetos: { nome: 'Edifício Residencial Horizonte' },
  },
  {
    id: 'mock-3',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    titulo: 'Redimensionamento do Quadro Elétrico Geral (QGD) e Barramentos',
    descricao: 'Adequação dos disjuntores e chaves seccionadoras da subestação abrigada após a atualização da carga térmica da central de água gelada (chillers de 120 TR).\n\nA nova demanda elétrica exige dimensionamento para barramento trifásico blindado de 800A.',
    disciplina_origem: 'Elétrica',
    disciplina_destino: 'Elétrica',
    status: 'Resolvido',
    prioridade: 'Baixa',
    tipo_conflito: 'Concepção Técnica',
    solucao: 'Redimensionado o disjuntor geral caixa moldada de 400A para 630A motorizado e atualizada a especificação do barramento de cobre para 80x10mm no projeto executivo de instalações elétricas industriais.',
    url_imagem: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    url_imagem_solucao: null,
    imagens_apontamento: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    ],
    imagens_solucao: [],
    projeto_id: 'proj-1',
    projetos: { nome: 'Hospital Central - Bloco A' },
  },
];
