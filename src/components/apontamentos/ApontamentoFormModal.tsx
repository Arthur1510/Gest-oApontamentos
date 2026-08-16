"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image as ImageIcon, Loader2, Sparkles, AlertCircle, Upload, X, Check, Link as LinkIcon, ClipboardCheck, FolderKanban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DISCIPLINAS_OPCOES, NovoApontamento, PrioridadeApontamento, StatusApontamento, Projeto } from '@/types/apontamento';
import { uploadImageToClashesBucket, supabase, isSupabaseConfigured, MOCK_PROJETOS } from '@/lib/supabase/client';

interface ApontamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apontamento: NovoApontamento) => Promise<void>;
}

const SAMPLE_IMAGES = [
  { label: 'Obra / Estrutura', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Instalações', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
  { label: 'Quadro Elétrico', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Planta BIM / Projeto', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80' },
];

export function ApontamentoFormModal({ isOpen, onClose, onSubmit }: ApontamentoFormModalProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplinaOrigem, setDisciplinaOrigem] = useState<string>(DISCIPLINAS_OPCOES[0]);
  const [disciplinaDestino, setDisciplinaDestino] = useState<string>(DISCIPLINAS_OPCOES[1]);
  const [status, setStatus] = useState<StatusApontamento>('Aberto');
  const [prioridade, setPrioridade] = useState<PrioridadeApontamento>('Média');
  
  // Relacionamento com Projeto (Dropdown)
  const [projetoId, setProjetoId] = useState<string>('');
  const [projetosOpcoes, setProjetosOpcoes] = useState<Projeto[]>([]);
  const [isLoadingProjetos, setIsLoadingProjetos] = useState(false);

  // Imagem: via Upload de arquivo local / Ctrl + V ou via URL externa
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [urlImagem, setUrlImagem] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pasteSuccessMsg, setPasteSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar lista de Projetos ao abrir o Modal
  useEffect(() => {
    if (!isOpen) return;

    const loadProjetos = async () => {
      setIsLoadingProjetos(true);
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase
            .from('projetos')
            .select('*')
            .eq('status', 'Ativo')
            .order('nome', { ascending: true });

          if (error || !data) {
            setProjetosOpcoes(MOCK_PROJETOS);
          } else {
            setProjetosOpcoes(data as Projeto[]);
          }
        } catch {
          setProjetosOpcoes(MOCK_PROJETOS);
        }
      } else {
        setProjetosOpcoes(MOCK_PROJETOS);
      }
      setIsLoadingProjetos(false);
    };

    loadProjetos();
  }, [isOpen]);

  // Escuta evento de Colar (Ctrl + V) globalmente no Modal quando aberto
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const ext = file.type.split('/')[1] || 'png';
            const pastedFile = new File([file], `print_colado_${Date.now()}.${ext}`, { type: file.type });
            
            setSelectedFile(pastedFile);
            const objectUrl = URL.createObjectURL(pastedFile);
            setFilePreviewUrl(objectUrl);
            setImageMode('file');
            setErrorMsg('');
            setPasteSuccessMsg('Imagem colada com sucesso da área de transferência (Ctrl + V)!');
            setTimeout(() => setPasteSuccessMsg(''), 4000);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Por favor, selecione apenas arquivos de imagem (PNG, JPG, WEBP, etc.).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('O tamanho máximo do arquivo de imagem é 10MB.');
        return;
      }

      setErrorMsg('');
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setFilePreviewUrl(objectUrl);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMsg('Por favor, informe o título do apontamento.');
      return;
    }
    if (!descricao.trim()) {
      setErrorMsg('Por favor, informe a descrição detalhada.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      
      let finalImageUrl: string | null = null;

      // 1. Upload da imagem se houver arquivo selecionado
      if (imageMode === 'file' && selectedFile) {
        setUploadStatusText('Enviando imagem para o Supabase Storage (bucket "clashes")...');
        finalImageUrl = await uploadImageToClashesBucket(selectedFile);
      } else if (imageMode === 'url' && urlImagem.trim()) {
        finalImageUrl = urlImagem.trim();
      }

      // 2. Salva o apontamento no banco com projeto_id vinculado
      setUploadStatusText('Gravando apontamento no banco de dados...');
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        disciplina_origem: disciplinaOrigem,
        disciplina_destino: disciplinaDestino,
        status,
        prioridade,
        url_imagem: finalImageUrl,
        projeto_id: projetoId || null,
      });

      // Reset form
      setTitulo('');
      setDescricao('');
      setProjetoId('');
      handleRemoveFile();
      setUrlImagem('');
      setStatus('Aberto');
      setPrioridade('Média');
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao registrar apontamento.');
    } finally {
      setIsSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Novo Registro com Projeto
          </div>
          <DialogTitle className="text-xl">Cadastrar Apontamento</DialogTitle>
          <DialogDescription>
            Registre uma interferência e vincule a um projeto específico no Supabase.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-2 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {pasteSuccessMsg && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in-0 duration-200">
            <ClipboardCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{pasteSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Seleção do Projeto (Pulo do Gato) */}
          <div className="space-y-1.5">
            <Label htmlFor="projeto_id" className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
              <FolderKanban className="h-4 w-4" /> Projeto Associado
            </Label>
            <select
              id="projeto_id"
              className="flex h-10 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
            >
              <option value="">-- Sem projeto específico (Geral) --</option>
              {projetosOpcoes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.status})
                </option>
              ))}
            </select>
            {isLoadingProjetos && (
              <span className="text-[11px] text-slate-400">Carregando projetos do Supabase...</span>
            )}
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título do Apontamento *</Label>
            <Input
              id="titulo"
              placeholder="Ex: Interferência entre Duto de HVAC e Viga Metálica"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          {/* Disciplina Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="disciplina_origem">Disciplina Origem *</Label>
              <select
                id="disciplina_origem"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                value={disciplinaOrigem}
                onChange={(e) => setDisciplinaOrigem(e.target.value)}
              >
                {DISCIPLINAS_OPCOES.map((d) => (
                  <option key={`origem-${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disciplina_destino">Disciplina Destino *</Label>
              <select
                id="disciplina_destino"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                value={disciplinaDestino}
                onChange={(e) => setDisciplinaDestino(e.target.value)}
              >
                {DISCIPLINAS_OPCOES.map((d) => (
                  <option key={`destino-${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prioridade e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <select
                id="prioridade"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeApontamento)}
              >
                <option value="Baixa">Baixa (Menor Urgência)</option>
                <option value="Média">Média (Acompanhamento Regular)</option>
                <option value="Alta">Alta (Crítico / Bloqueia Obra)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status Inicial *</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusApontamento)}
              >
                <option value="Aberto">Aberto</option>
                <option value="Resolvido">Resolvido</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição Detalhada *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o problema, localização no projeto/obra e recomendações de resolução..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Seção de Upload de Imagem no Bucket 'clashes' */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <ImageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Imagem do Apontamento
              </Label>
              
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImageMode('file')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    imageMode === 'file'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="h-3 w-3" /> Arquivo / Ctrl + V
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    imageMode === 'url'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="h-3 w-3" /> URL Externa
                </button>
              </div>
            </div>

            {imageMode === 'file' && (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="image-file-input"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 group relative"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-full bg-white dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 group-hover:scale-110 transition-all shadow-2xs">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Clique para selecionar uma imagem ou pressione <kbd className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">Ctrl + V</kbd> para colar
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Imagens de print ou arquivos serão enviados para o bucket <strong className="text-indigo-600 dark:text-indigo-400">clashes</strong> do Supabase
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {filePreviewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviewUrl}
                          alt="Prévia"
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      )}
                      <div className="overflow-hidden text-xs">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Upload no bucket <span className="font-mono text-indigo-600 dark:text-indigo-400">clashes</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {imageMode === 'url' && (
              <div className="space-y-2">
                <Input
                  id="url_imagem"
                  placeholder="https://exemplo.com/foto-do-projeto.jpg"
                  value={urlImagem}
                  onChange={(e) => setUrlImagem(e.target.value)}
                />
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Ou selecione uma foto de demonstração:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_IMAGES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setUrlImagem(sample.url)}
                        className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {urlImagem && (
                  <div className="mt-2 relative rounded-lg border border-slate-200 overflow-hidden h-28 bg-slate-100 dark:bg-slate-850">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlImagem}
                      alt="Pré-visualização"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2 justify-between items-center">
            {uploadStatusText ? (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{uploadStatusText}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                * Campos obrigatórios
              </span>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="indigo" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Cadastrar Apontamento
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
