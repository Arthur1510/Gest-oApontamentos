import { createClient } from '@supabase/supabase-js';
import { Apontamento, Projeto } from '@/types/apontamento';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const isForceMockMode = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
};

export const isSupabaseConfigured = (): boolean => {
  if (isForceMockMode()) {
    return false;
  }
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('sua-url-do-supabase') &&
    supabaseUrl.startsWith('https://')
  );
};

export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Envia uma imagem/arquivo para o bucket 'clashes' no Supabase Storage
 * e retorna a URL pública gerada.
 */
export const uploadImageToClashesBucket = async (file: File): Promise<string> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Retorna URL Data base64 para teste quando em modo demonstrativo
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const sanitizeName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filePath = `apontamentos/${Date.now()}_${sanitizeName}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('clashes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
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

// Mock data de Apontamentos vinculados
export const MOCK_APONTAMENTOS: Apontamento[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    titulo: 'Interferência entre Duto de HVAC e Viga Metálica',
    descricao: 'Conflito detectado no nível 3 (Eixo C-12). O duto principal de exaustão cruza diretamente a viga estrutural V-302.',
    disciplina_origem: 'Climatização (HVAC)',
    disciplina_destino: 'Estrutura',
    status: 'Aberto',
    prioridade: 'Alta',
    url_imagem: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    projeto_id: 'proj-1',
    projetos: { nome: 'Hospital Central - Bloco A' },
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    titulo: 'Passagem de Tubulação Hidráulica na Alvenaria Estrutural',
    descricao: 'Necessidade de adequação de shaft hidráulico no pavimento tipo para evitar corte desnecessário em bloco estrutural.',
    disciplina_origem: 'Hidráulica',
    disciplina_destino: 'Arquitetura',
    status: 'Aberto',
    prioridade: 'Média',
    url_imagem: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    projeto_id: 'proj-2',
    projetos: { nome: 'Edifício Residencial Horizonte' },
  },
  {
    id: 'mock-3',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    titulo: 'Redimensionamento do Quadro Elétrico Geral (QGD)',
    descricao: 'Adequação dos disjuntores da subestação após atualização da carga da central de água gelada.',
    disciplina_origem: 'Elétrica',
    disciplina_destino: 'Elétrica',
    status: 'Resolvido',
    prioridade: 'Baixa',
    url_imagem: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    projeto_id: 'proj-1',
    projetos: { nome: 'Hospital Central - Bloco A' },
  },
];
