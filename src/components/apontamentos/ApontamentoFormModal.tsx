"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image as ImageIcon, Loader2, Sparkles, AlertCircle, Upload, X, Link as LinkIcon, ClipboardCheck, FolderKanban, ShieldAlert, Lightbulb, Images, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SelectNative } from '@/components/ui/select-native';
import { DISCIPLINAS_OPCOES, NovoApontamento, PrioridadeApontamento, StatusApontamento, Projeto, TipoConflito, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';
import { uploadImageToClashesBucket, supabase, isSupabaseConfigured, MOCK_PROJETOS } from '@/lib/supabase/client';

interface ApontamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apontamento: NovoApontamento) => Promise<void>;
}

interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  isUrl: boolean;
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
  const [solucao, setSolucao] = useState('');
  const [disciplinaOrigem, setDisciplinaOrigem] = useState<string>(DISCIPLINAS_OPCOES[0]);
  const [disciplinaDestino, setDisciplinaDestino] = useState<string>(DISCIPLINAS_OPCOES[1]);
  const [status, setStatus] = useState<StatusApontamento>('Aberto');
  const [prioridade, setPrioridade] = useState<PrioridadeApontamento>('Média');
  const [tipoConflito, setTipoConflito] = useState<TipoConflito>('Conflito Físico');
  
  // Relacionamento com Projeto (Dropdown)
  const [projetoId, setProjetoId] = useState<string>('');
  const [projetosOpcoes, setProjetosOpcoes] = useState<Projeto[]>([]);
  const [isLoadingProjetos, setIsLoadingProjetos] = useState(false);

  // 1. Galeria de Imagens do Apontamento (Múltiplas)
  const [apontamentoImages, setApontamentoImages] = useState<ImageItem[]>([]);
  const [urlInputApontamento, setUrlInputApontamento] = useState('');

  // 2. Galeria de Imagens da Solução (Múltiplas)
  const [solucaoImages, setSolucaoImages] = useState<ImageItem[]>([]);
  const [urlInputSolucao, setUrlInputSolucao] = useState('');

  // Alvo do Paste (usamos useRef para evitar stale closure no listener global)
  const [activePasteTarget, setActivePasteTarget] = useState<'apontamento' | 'solucao'>('apontamento');
  const activePasteTargetRef = useRef<'apontamento' | 'solucao'>('apontamento');

  const setPasteTarget = (target: 'apontamento' | 'solucao') => {
    setActivePasteTarget(target);
    activePasteTargetRef.current = target;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pasteSuccessMsg, setPasteSuccessMsg] = useState('');

  const apontamentoFileInputRef = useRef<HTMLInputElement>(null);
  const solucaoFileInputRef = useRef<HTMLInputElement>(null);

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

  // Escuta evento de Colar (Ctrl + V) usando useRef para gararantir alvo correto
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
            const previewUrl = URL.createObjectURL(pastedFile);

            const newItem: ImageItem = {
              id: `paste-${Date.now()}-${Math.random()}`,
              file: pastedFile,
              previewUrl,
              isUrl: false,
            };

            const target = activePasteTargetRef.current;
            if (target === 'solucao') {
              setSolucaoImages((prev) => {
                const updated = [...prev, newItem];
                setPasteSuccessMsg(`Foto #${updated.length} da Solução colada com sucesso via Ctrl + V! 💡`);
                return updated;
              });
            } else {
              setApontamentoImages((prev) => {
                const updated = [...prev, newItem];
                setPasteSuccessMsg(`Foto #${updated.length} do Apontamento colada com sucesso via Ctrl + V! 📸`);
                return updated;
              });
            }

            setErrorMsg('');
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

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'apontamento' | 'solucao') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Apenas arquivos de imagem são permitidos (PNG, JPG, WEBP).');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('O tamanho máximo por arquivo de imagem é 10MB.');
        continue;
      }

      newItems.push({
        id: `file-${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isUrl: false,
      });
    }

    if (newItems.length > 0) {
      if (target === 'solucao') {
        setSolucaoImages((prev) => [...prev, ...newItems]);
      } else {
        setApontamentoImages((prev) => [...prev, ...newItems]);
      }
      setErrorMsg('');
    }
  };

  const handleAddUrlImage = (target: 'apontamento' | 'solucao', url: string) => {
    if (!url.trim()) return;
    const newItem: ImageItem = {
      id: `url-${Date.now()}`,
      previewUrl: url.trim(),
      isUrl: true,
    };

    if (target === 'solucao') {
      setSolucaoImages((prev) => [...prev, newItem]);
      setUrlInputSolucao('');
    } else {
      setApontamentoImages((prev) => [...prev, newItem]);
      setUrlInputApontamento('');
    }
  };

  const handleRemoveImage = (target: 'apontamento' | 'solucao', id: string) => {
    if (target === 'solucao') {
      setSolucaoImages((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item && !item.isUrl) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((i) => i.id !== id);
      });
    } else {
      setApontamentoImages((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item && !item.isUrl) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((i) => i.id !== id);
      });
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

      // 1. Upload de todas as imagens do Apontamento
      const finalApontamentoUrls: string[] = [];
      if (apontamentoImages.length > 0) {
        setUploadStatusText(`Enviando ${apontamentoImages.length} foto(s) do apontamento para o Supabase...`);
        for (const item of apontamentoImages) {
          if (item.isUrl) {
            finalApontamentoUrls.push(item.previewUrl);
          } else if (item.file) {
            const uploadedUrl = await uploadImageToClashesBucket(item.file);
            if (uploadedUrl) finalApontamentoUrls.push(uploadedUrl);
          }
        }
      }

      // 2. Upload de todas as imagens da Solução
      const finalSolucaoUrls: string[] = [];
      if (solucaoImages.length > 0) {
        setUploadStatusText(`Enviando ${solucaoImages.length} foto(s) da solução para o Supabase...`);
        for (const item of solucaoImages) {
          if (item.isUrl) {
            finalSolucaoUrls.push(item.previewUrl);
          } else if (item.file) {
            const uploadedUrl = await uploadImageToClashesBucket(item.file);
            if (uploadedUrl) finalSolucaoUrls.push(uploadedUrl);
          }
        }
      }

      // 3. Gravando apontamento com listas completas
      setUploadStatusText('Gravando apontamento no banco de dados...');
      await onSubmit({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        solucao: solucao.trim() || null,
        disciplina_origem: disciplinaOrigem,
        disciplina_destino: disciplinaDestino,
        status,
        prioridade,
        tipo_conflito: tipoConflito,
        url_imagem: finalApontamentoUrls[0] || null,
        url_imagem_solucao: finalSolucaoUrls[0] || null,
        imagens_apontamento: finalApontamentoUrls,
        imagens_solucao: finalSolucaoUrls,
        projeto_id: projetoId || null,
      });

      // Reset total
      setTitulo('');
      setDescricao('');
      setSolucao('');
      setProjetoId('');
      setApontamentoImages([]);
      setSolucaoImages([]);
      setStatus('Aberto');
      setPrioridade('Média');
      setTipoConflito('Conflito Físico');
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Suporte a Múltiplas Fotos & Guia Solução (Ctrl + V)
          </div>
          <DialogTitle className="text-xl">Cadastrar Apontamento</DialogTitle>
          <DialogDescription>
            Registre uma interferência e anexe múltiplos prints do problema e da solução proposta.
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
            <span className="font-semibold">{pasteSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Seleção do Projeto */}
          <div className="space-y-1.5">
            <Label htmlFor="projeto_id" className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
              <FolderKanban className="h-4 w-4" /> Projeto Associado
            </Label>
            <SelectNative
              id="projeto_id"
              variant="indigo"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
            >
              <option value="">-- Sem projeto específico (Geral) --</option>
              {projetosOpcoes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.status})
                </option>
              ))}
            </SelectNative>
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
              className="h-10 rounded-xl"
            />
          </div>

          {/* Tipo do Conflito / Apontamento & Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tipo_conflito" className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Tipo de Apontamento *
              </Label>
              <SelectNative
                id="tipo_conflito"
                variant="amber"
                value={tipoConflito}
                onChange={(e) => setTipoConflito(e.target.value as TipoConflito)}
              >
                {TIPOS_CONFLITO_OPCOES.map((tc) => (
                  <option key={`tc-${tc}`} value={tc}>
                    {tc}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prioridade">Prioridade *</Label>
              <SelectNative
                id="prioridade"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeApontamento)}
              >
                <option value="Baixa">Baixa (Menor Urgência)</option>
                <option value="Média">Média (Acompanhamento Regular)</option>
                <option value="Alta">Alta (Crítico / Bloqueia Obra)</option>
              </SelectNative>
            </div>
          </div>

          {/* Disciplina Origem e Destino */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="disciplina_origem">Disciplina Origem *</Label>
              <SelectNative
                id="disciplina_origem"
                value={disciplinaOrigem}
                onChange={(e) => setDisciplinaOrigem(e.target.value)}
              >
                {DISCIPLINAS_OPCOES.map((d) => (
                  <option key={`origem-${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="disciplina_destino">Disciplina Destino *</Label>
              <SelectNative
                id="disciplina_destino"
                value={disciplinaDestino}
                onChange={(e) => setDisciplinaDestino(e.target.value)}
              >
                {DISCIPLINAS_OPCOES.map((d) => (
                  <option key={`destino-${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>

          {/* Status Inicial */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status Inicial *</Label>
            <SelectNative
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusApontamento)}
            >
              <option value="Aberto">Aberto</option>
              <option value="Resolvido">Resolvido</option>
            </SelectNative>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição Detalhada *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o problema, localização no projeto/obra e recomendações..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              required
              className="rounded-xl"
            />
          </div>

          {/* GALERIA 1: IMAGENS DO APONTAMENTO */}
          <div
            onClick={() => setPasteTarget('apontamento')}
            className={`space-y-3 pt-2 border rounded-2xl p-4 transition-all cursor-pointer ${
              activePasteTarget === 'apontamento'
                ? 'border-indigo-500 dark:border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <Images className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                1. Fotos do Apontamento ({apontamentoImages.length})
              </Label>
              <button
                type="button"
                onClick={() => setPasteTarget('apontamento')}
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors flex items-center gap-1 ${
                  activePasteTarget === 'apontamento'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {activePasteTarget === 'apontamento' && <Check className="h-3 w-3" />} Alvo ativo do Ctrl + V
              </button>
            </div>

            {/* Inputs de Upload / URL */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={apontamentoFileInputRef}
                onChange={(e) => handleFilesSelect(e, 'apontamento')}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPasteTarget('apontamento');
                  apontamentoFileInputRef.current?.click();
                }}
                className="text-xs h-9 gap-1.5 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-600" /> Anexar Fotos
              </Button>

              <div className="flex items-center gap-1.5 flex-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  placeholder="Ou cole URL da foto..."
                  value={urlInputApontamento}
                  onChange={(e) => setUrlInputApontamento(e.target.value)}
                  onFocus={() => setPasteTarget('apontamento')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage('apontamento', urlInputApontamento);
                    }
                  }}
                  className="h-9 text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddUrlImage('apontamento', urlInputApontamento)}
                  className="h-9 text-xs"
                >
                  + Add URL
                </Button>
              </div>
            </div>

            {/* Grid/Galeria de Imagens Selecionadas do Apontamento */}
            {apontamentoImages.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
                {apontamentoImages.map((img, idx) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-slate-950 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-slate-950/80 text-white text-[9px] font-mono px-1 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage('apontamento', img.id);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 opacity-90 group-hover:opacity-100 transition-opacity"
                      title="Remover foto"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Clique neste bloco e pressione <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">Ctrl + V</kbd> para colar prints do problema.
              </p>
            )}
          </div>

          {/* GALERIA 2: GUIA SOLUÇÃO & IMAGENS DA SOLUÇÃO */}
          <div
            onClick={() => setPasteTarget('solucao')}
            className={`space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border transition-all cursor-pointer ${
              activePasteTarget === 'solucao'
                ? 'border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/30'
                : 'border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="solucao" className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 2. Guia de Solução & Fotos da Solução ({solucaoImages.length})
              </Label>
              <button
                type="button"
                onClick={() => setPasteTarget('solucao')}
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold transition-colors flex items-center gap-1 ${
                  activePasteTarget === 'solucao'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                }`}
              >
                {activePasteTarget === 'solucao' && <Check className="h-3 w-3" />} Alvo ativo do Ctrl + V
              </button>
            </div>

            <Textarea
              id="solucao"
              placeholder="Descreva a solução técnica recomendada, alteração de traçado ou diretriz de engenharia..."
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              onFocus={() => setPasteTarget('solucao')}
              rows={2}
              className="border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-950 rounded-xl text-xs"
            />

            {/* Area de Dropzone/Upload para Imagens da Solucao */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={solucaoFileInputRef}
                  onChange={(e) => handleFilesSelect(e, 'solucao')}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPasteTarget('solucao');
                    solucaoFileInputRef.current?.click();
                  }}
                  className="text-xs h-8 gap-1 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 bg-white dark:bg-slate-950 text-emerald-800 dark:text-emerald-200"
                >
                  <Upload className="h-3 w-3 text-emerald-600" /> Anexar Fotos da Solução
                </Button>

                <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="URL da foto da solução..."
                    value={urlInputSolucao}
                    onChange={(e) => setUrlInputSolucao(e.target.value)}
                    onFocus={() => setPasteTarget('solucao')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUrlImage('solucao', urlInputSolucao);
                      }
                    }}
                    className="h-8 text-xs rounded-xl bg-white dark:bg-slate-950"
                  />
                  <Button
                    type="button"
                    variant="emerald"
                    size="sm"
                    onClick={() => handleAddUrlImage('solucao', urlInputSolucao)}
                    className="h-8 text-xs"
                  >
                    + Add
                  </Button>
                </div>
              </div>

              {/* Grid de Fotos da Solução */}
              {solucaoImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                  {solucaoImages.map((img, idx) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 bg-slate-950 aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={`Foto Solução ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-emerald-950/80 text-white text-[9px] font-mono px-1 rounded">
                        Solução #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage('solucao', img.id);
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 opacity-90 group-hover:opacity-100 transition-opacity"
                        title="Remover foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
                  Clique neste bloco verde e pressione <kbd className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 rounded">Ctrl + V</kbd> para colar prints da Solução.
                </p>
              )}
            </div>
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
