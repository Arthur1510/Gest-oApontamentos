"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ArrowRight, CheckCircle2, AlertCircle, Trash2, ExternalLink, ShieldAlert, Lightbulb, Save, Upload, X, Images, ClipboardCheck, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Apontamento } from '@/types/apontamento';
import { formatDate } from '@/lib/utils';
import { supabase, isSupabaseConfigured, uploadImageToClashesBucket } from '@/lib/supabase/client';

interface ApontamentoDetailModalProps {
  apontamento: Apontamento | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (apontamento: Apontamento) => void;
  onToggleStatus: (apontamento: Apontamento) => void;
  onDelete: (id: string) => void;
  onUpdateSolucao?: (id: string, solucao: string, urlImagemSolucao?: string | null, imagensSolucao?: string[] | null) => void;
}

export function ApontamentoDetailModal({
  apontamento,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
  onUpdateSolucao,
}: ApontamentoDetailModalProps) {
  const [solucaoTexto, setSolucaoTexto] = useState('');
  const [solucaoImagesList, setSolucaoImagesList] = useState<string[]>([]);
  const [newSolucaoFiles, setNewSolucaoFiles] = useState<{ file?: File; previewUrl: string }[]>([]);
  const [urlInputSolucao, setUrlInputSolucao] = useState('');
  const [pasteNotice, setPasteNotice] = useState('');

  const [selectedApontamentoImageIdx, setSelectedApontamentoImageIdx] = useState(0);
  const [selectedSolucaoImageIdx, setSelectedSolucaoImageIdx] = useState(0);

  const [isSavingSolucao, setIsSavingSolucao] = useState(false);
  const [isEditingSolucao, setIsEditingSolucao] = useState(false);
  const solucaoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (apontamento) {
      setSolucaoTexto(apontamento.solucao || '');
      
      const solImages = apontamento.imagens_solucao && apontamento.imagens_solucao.length > 0
        ? apontamento.imagens_solucao
        : apontamento.url_imagem_solucao
        ? [apontamento.url_imagem_solucao]
        : [];

      setSolucaoImagesList(solImages);
      setNewSolucaoFiles([]);
      setSelectedApontamentoImageIdx(0);
      setSelectedSolucaoImageIdx(0);
      setIsEditingSolucao(!apontamento.solucao && solImages.length === 0);
      setPasteNotice('');
    }
  }, [apontamento]);

  // Suporte a Ctrl + V ao editar solução no modal de detalhes
  useEffect(() => {
    if (!isOpen || !isEditingSolucao) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const ext = file.type.split('/')[1] || 'png';
            const pastedFile = new File([file], `solucao_colada_${Date.now()}.${ext}`, { type: file.type });
            const previewUrl = URL.createObjectURL(pastedFile);
            setNewSolucaoFiles((prev) => [...prev, { file: pastedFile, previewUrl }]);
            setPasteNotice('Nova foto da solução colada via Ctrl + V! 💡');
            setTimeout(() => setPasteNotice(''), 4000);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isEditingSolucao]);

  if (!apontamento) return null;

  // Lista combinada de todas as imagens do Apontamento
  const allApontamentoImages = apontamento.imagens_apontamento && apontamento.imagens_apontamento.length > 0
    ? apontamento.imagens_apontamento
    : apontamento.url_imagem
    ? [apontamento.url_imagem]
    : [];

  const handleSaveSolucao = async () => {
    if (!apontamento) return;
    try {
      setIsSavingSolucao(true);
      const uploadedUrls: string[] = [];

      for (const item of newSolucaoFiles) {
        if (item.file) {
          const url = await uploadImageToClashesBucket(item.file);
          if (url) uploadedUrls.push(url);
        } else if (item.previewUrl) {
          uploadedUrls.push(item.previewUrl);
        }
      }

      const finalSolucaoList = [...solucaoImagesList, ...uploadedUrls];
      const primarySolucaoUrl = finalSolucaoList[0] || null;

      apontamento.solucao = solucaoTexto.trim();
      apontamento.url_imagem_solucao = primarySolucaoUrl;
      apontamento.imagens_solucao = finalSolucaoList;

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('apontamentos')
          .update({
            solucao: solucaoTexto.trim() || null,
            url_imagem_solucao: primarySolucaoUrl,
            imagens_solucao: finalSolucaoList,
          })
          .eq('id', apontamento.id);
      }

      if (onUpdateSolucao) {
        onUpdateSolucao(apontamento.id, solucaoTexto.trim(), primarySolucaoUrl, finalSolucaoList);
      }
      setIsEditingSolucao(false);
    } catch (err) {
      console.error('Erro ao salvar solução:', err);
    } finally {
      setIsSavingSolucao(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={apontamento.status === 'Resolvido' ? 'resolvido' : 'aberto'}>
                {apontamento.status}
              </Badge>
              <Badge
                variant={
                  apontamento.prioridade === 'Alta'
                    ? 'alta'
                    : apontamento.prioridade === 'Média'
                    ? 'media'
                    : 'baixa'
                }
              >
                Prioridade {apontamento.prioridade}
              </Badge>

              {/* Badge Tipo de Apontamento */}
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {apontamento.tipo_conflito || 'Conflito Físico'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(apontamento.created_at)}
            </div>
          </div>
          <DialogTitle className="text-xl mt-2">{apontamento.titulo}</DialogTitle>
          <DialogDescription>
            Detalhes do apontamento e acompanhamento da solução entre disciplinas.
          </DialogDescription>
        </DialogHeader>

        {/* Informações da Rota de Disciplina */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#041A24] p-3 rounded-xl border border-slate-200/80 dark:border-[#0B384D] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider">Origem:</span>
          <span className="px-2.5 py-1 rounded bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-2xs font-extrabold text-[#00A3C4] dark:text-[#00C4EB]">
            {apontamento.disciplina_origem}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider">Destino:</span>
          <span className="px-2.5 py-1 rounded bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-2xs font-extrabold text-rose-600 dark:text-rose-400">
            {apontamento.disciplina_destino}
          </span>
        </div>

        {/* GALERIA DE IMAGENS DO APONTAMENTO */}
        {allApontamentoImages.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Images className="h-3.5 w-3.5 text-[#00A3C4] dark:text-[#00C4EB]" />
                Galeria de Fotos do Apontamento ({allApontamentoImages.length})
              </span>
              <a
                href={allApontamentoImages[selectedApontamentoImageIdx]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#00A3C4] dark:text-[#00C4EB] hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink className="h-3 w-3" /> Abrir imagem original
              </a>
            </div>

            {/* Imagem Principal Ativa */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-[#0B384D] overflow-hidden bg-[#041A24] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={allApontamentoImages[selectedApontamentoImageIdx]}
                alt={apontamento.titulo}
                className="w-full h-72 object-contain object-center max-h-96"
              />
              <div className="absolute top-2 left-2 bg-[#072B3B]/90 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-[#0B384D]">
                Foto #{selectedApontamentoImageIdx + 1} de {allApontamentoImages.length}
              </div>
            </div>

            {/* Carrossel de Miniaturas se houver mais de 1 foto */}
            {allApontamentoImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {allApontamentoImages.map((imgUrl, idx) => (
                  <button
                    key={`thumb-apt-${idx}`}
                    type="button"
                    onClick={() => setSelectedApontamentoImageIdx(idx)}
                    className={`relative rounded-lg overflow-hidden border-2 shrink-0 w-16 h-16 transition-all ${
                      selectedApontamentoImageIdx === idx
                        ? 'border-[#00A3C4] ring-2 ring-[#00A3C4]/30 scale-105'
                        : 'border-slate-300 dark:border-[#0B384D] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Descrição Técnica */}
        <div className="space-y-1.5 py-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição Técnica</h4>
          <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            {apontamento.descricao}
          </p>
        </div>

        {/* GUIA / BLOCO DE SOLUÇÃO PROPOSTA & GALERIA */}
        <div className="space-y-3 py-1 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Guia de Solução Técnica / Diretriz & Fotos
            </h4>
            {!isEditingSolucao && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSolucao(true)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 h-7 px-2"
              >
                Editar Solução
              </Button>
            )}
          </div>

          {pasteNotice && (
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100 p-2 text-xs flex items-center gap-2 border border-emerald-300 font-semibold animate-in fade-in-0">
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <span>{pasteNotice}</span>
            </div>
          )}

          {isEditingSolucao ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Descreva a solução proposta, alteração de traçado ou diretriz de engenharia..."
                value={solucaoTexto}
                onChange={(e) => setSolucaoTexto(e.target.value)}
                rows={3}
                className="text-xs bg-white dark:bg-slate-950 border-emerald-300 dark:border-emerald-800 rounded-xl"
              />

              {/* Upload ou Ctrl + V de Múltiplas Fotos da Solução */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 block">
                  Anexar Fotos da Solução (Pressione <kbd className="bg-emerald-200 dark:bg-emerald-900 px-1 py-0.5 rounded font-mono text-[10px]">Ctrl + V</kbd> para colar):
                </span>
                <input
                  type="file"
                  ref={solucaoFileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const newArr: { file?: File; previewUrl: string }[] = [];
                      for (let i = 0; i < files.length; i++) {
                        newArr.push({ file: files[i], previewUrl: URL.createObjectURL(files[i]) });
                      }
                      setNewSolucaoFiles((prev) => [...prev, ...newArr]);
                    }
                  }}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => solucaoFileInputRef.current?.click()}
                    className="text-xs h-8 border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-950 text-emerald-800 dark:text-emerald-200"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Selecionar Imagens
                  </Button>

                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      placeholder="URL da imagem da solução..."
                      value={urlInputSolucao}
                      onChange={(e) => setUrlInputSolucao(e.target.value)}
                      className="h-8 text-xs rounded-xl bg-white dark:bg-slate-950"
                    />
                    <Button
                      type="button"
                      variant="emerald"
                      size="sm"
                      onClick={() => {
                        if (urlInputSolucao.trim()) {
                          setSolucaoImagesList((prev) => [...prev, urlInputSolucao.trim()]);
                          setUrlInputSolucao('');
                        }
                      }}
                      className="h-8 text-xs"
                    >
                      + Add URL
                    </Button>
                  </div>
                </div>

                {/* Dropzone para colar com Ctrl + V */}
                <div
                  onClick={() => solucaoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 rounded-xl p-3 text-center cursor-pointer bg-white dark:bg-slate-950 transition-colors"
                >
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-medium">
                    <Upload className="h-3.5 w-3.5" /> Clique para selecionar ou cole prints da Solução com <kbd className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 rounded">Ctrl + V</kbd>
                  </p>
                </div>

                {/* Lista Combinada de Fotos da Solução no Modo Edição */}
                {(solucaoImagesList.length > 0 || newSolucaoFiles.length > 0) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {solucaoImagesList.map((url, idx) => (
                      <div key={`existing-sol-${idx}`} className="relative rounded-lg overflow-hidden border border-emerald-300 w-14 h-14 bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Solução" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSolucaoImagesList((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                          title="Remover foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {newSolucaoFiles.map((item, idx) => (
                      <div key={`new-sol-${idx}`} className="relative rounded-lg overflow-hidden border border-emerald-400 w-14 h-14 bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.previewUrl} alt="Nova Solução" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewSolucaoFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5"
                          title="Remover foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingSolucao(false)}
                  className="text-xs h-7"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="emerald"
                  size="sm"
                  onClick={handleSaveSolucao}
                  disabled={isSavingSolucao}
                  className="text-xs h-7 gap-1"
                >
                  <Save className="h-3 w-3" /> Salvando...
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-normal whitespace-pre-wrap">
                {solucaoTexto || 'Nenhuma solução técnica por texto registrada ainda.'}
              </p>

              {/* Exibição da Galeria da Solução em Modo Leitura */}
              {solucaoImagesList.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase block">
                    Fotos da Solução Proposta ({solucaoImagesList.length})
                  </span>

                  <div className="relative rounded-xl border border-emerald-300 dark:border-emerald-800 overflow-hidden bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={solucaoImagesList[selectedSolucaoImageIdx]}
                      alt="Foto da Solução"
                      className="w-full h-56 object-contain object-center max-h-72"
                    />
                    <a
                      href={solucaoImagesList[selectedSolucaoImageIdx]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver original
                    </a>
                  </div>

                  {solucaoImagesList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {solucaoImagesList.map((url, idx) => (
                        <button
                          key={`thumb-sol-${idx}`}
                          type="button"
                          onClick={() => setSelectedSolucaoImageIdx(idx)}
                          className={`relative rounded-lg overflow-hidden border-2 shrink-0 w-14 h-14 transition-all ${
                            selectedSolucaoImageIdx === idx
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-105'
                              : 'border-emerald-200 dark:border-emerald-900 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Solução ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between sm:justify-between items-center gap-2">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Tem certeza de que deseja excluir este apontamento?')) {
                  onDelete(apontamento.id);
                  onClose();
                }
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>

            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(apontamento);
                }}
                className="text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-xs gap-1.5"
              >
                <Pencil className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Editar Apontamento
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant={apontamento.status === 'Aberto' ? 'emerald' : 'outline'}
              size="sm"
              onClick={() => {
                onToggleStatus(apontamento);
                onClose();
              }}
              className="gap-1.5 text-xs"
            >
              {apontamento.status === 'Aberto' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Resolvido
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Reabrir Apontamento
                </>
              )}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
