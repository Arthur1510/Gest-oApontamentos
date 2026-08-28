"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  ConflitoArcis,
  NovoConflitoArcis,
  StatusConflitoArcis,
  PrioridadeArcis,
  STATUS_ARCIS_OPCOES,
  TIPOS_CONFLITO_ARCIS_OPCOES,
} from '@/types/arcis';
import { Projeto } from '@/types/apontamento';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectNative } from '@/components/ui/select-native';
import { Plus, Edit2, Save, X, Upload, Image as ImageIcon, Trash2, ClipboardCheck, Link as LinkIcon, Loader2, Images } from 'lucide-react';
import { uploadImageToClashesBucket, isSupabaseConfigured } from '@/lib/supabase/client';
import { compressImage } from '@/lib/image-compression';

interface ArcisConflictFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflitoParaEditar?: ConflitoArcis | null;
  projetos: Projeto[];
  defaultProjetoId?: string;
  proximoCodigo?: number;
  onSave: (conflito: NovoConflitoArcis, id?: string) => Promise<void> | void;
}

export function ArcisConflictFormModal({
  isOpen,
  onClose,
  conflitoParaEditar,
  projetos,
  defaultProjetoId,
  proximoCodigo = 1,
  onSave,
}: ArcisConflictFormModalProps) {
  const [codigoConflito, setCodigoConflito] = useState<number>(proximoCodigo);
  const [projetoId, setProjetoId] = useState<string>('');
  const [statusArcis, setStatusArcis] = useState<StatusConflitoArcis>('Aguardando Solução');
  const [prioridade, setPrioridade] = useState<PrioridadeArcis>('Normal');
  const [tipoConflito, setTipoConflito] = useState<string>('Conflito Normativo');
  const [disciplinaPrincipal, setDisciplinaPrincipal] = useState<string>('ARQUITETURA LEGAL');
  const [disciplinasEnvolvidas, setDisciplinasEnvolvidas] = useState<string>('INCÊNDIO');
  const [edificacao, setEdificacao] = useState<string>('TORRE');
  const [pavimentosText, setPavimentosText] = useState<string>('TÉRREO, ÁTICO');
  const [localizacao, setLocalizacao] = useState<string>('ÁTRIO');
  const [descricao, setDescricao] = useState<string>('');
  const [solucao, setSolucao] = useState<string>('');
  
  // Imagem do Conflito ARCIS
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [pasteSuccessMsg, setPasteSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conflitoParaEditar) {
      setCodigoConflito(conflitoParaEditar.codigo_conflito);
      setProjetoId(conflitoParaEditar.projeto_id || '');
      setStatusArcis(conflitoParaEditar.status_arcis);
      setPrioridade(conflitoParaEditar.prioridade);
      setTipoConflito(conflitoParaEditar.tipo_conflito);
      setDisciplinaPrincipal(conflitoParaEditar.disciplina_principal);
      setDisciplinasEnvolvidas(conflitoParaEditar.disciplinas_envolvidas?.join(', ') || '');
      setEdificacao(conflitoParaEditar.edificacao || 'TORRE');
      setPavimentosText(conflitoParaEditar.pavimentos?.join(', ') || '');
      setLocalizacao(conflitoParaEditar.localizacao || '');
      setDescricao(conflitoParaEditar.descricao || '');
      setSolucao(conflitoParaEditar.solucao || '');
      setImagemPreview(conflitoParaEditar.url_imagem || (conflitoParaEditar.imagens && conflitoParaEditar.imagens[0]) || null);
      setImageFile(null);
      setImageUrlInput('');
      setShowUrlInput(false);
    } else {
      setCodigoConflito(proximoCodigo);
      setProjetoId(defaultProjetoId || projetos[0]?.id || '');
      setStatusArcis('Aguardando Solução');
      setPrioridade('Normal');
      setTipoConflito('Conflito Normativo');
      setDisciplinaPrincipal('ARQUITETURA LEGAL');
      setDisciplinasEnvolvidas('INCÊNDIO');
      setEdificacao('TORRE');
      setPavimentosText('');
      setLocalizacao('');
      setDescricao('');
      setSolucao('');
      setImagemPreview(null);
      setImageFile(null);
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  }, [conflitoParaEditar, proximoCodigo, projetos, defaultProjetoId, isOpen]);

  // Listener para Colar Imagem (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const optimized = await compressImage(file);
            const previewUrl = URL.createObjectURL(optimized);
            setImageFile(optimized);
            setImagemPreview(previewUrl);
            setPasteSuccessMsg('Foto do relatório colada via Ctrl+V!');
            setTimeout(() => setPasteSuccessMsg(''), 3000);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await compressImage(file);
      const previewUrl = URL.createObjectURL(optimized);
      setImageFile(optimized);
      setImagemPreview(previewUrl);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    }
  };

  const handleAddUrl = () => {
    if (imageUrlInput.trim()) {
      setImagemPreview(imageUrlInput.trim());
      setImageFile(null);
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = () => {
    setImagemPreview(null);
    setImageFile(null);
    setImageUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !disciplinaPrincipal.trim()) return;

    const pavsArray = pavimentosText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const discArray = disciplinasEnvolvidas
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    setIsSaving(true);
    let finalUrl = imagemPreview || null;
    let finalImagens = imagemPreview ? [imagemPreview] : [];

    if (imageFile && isSupabaseConfigured()) {
      try {
        const uploadedUrl = await uploadImageToClashesBucket(imageFile);
        if (uploadedUrl) {
          finalUrl = uploadedUrl;
          finalImagens = [uploadedUrl];
        }
      } catch (upErr) {
        console.warn('Upload de imagem falhou, mantendo imagem local:', upErr);
      }
    }

    const payload: NovoConflitoArcis = {
      codigo_conflito: codigoConflito,
      projeto_id: projetoId || null,
      status_arcis: statusArcis,
      prioridade,
      tipo_conflito: tipoConflito,
      disciplina_principal: disciplinaPrincipal.toUpperCase(),
      disciplinas_envolvidas: discArray.map((d) => d.toUpperCase()),
      edificacao: edificacao.toUpperCase(),
      pavimentos: pavsArray,
      localizacao: localizacao || null,
      descricao: descricao.trim(),
      solucao: solucao.trim() || null,
      data_criacao_arcis: conflitoParaEditar?.data_criacao_arcis || new Date().toISOString().slice(0, 10),
      data_ultima_alteracao: new Date().toISOString().slice(0, 10),
      numero_relatorio: conflitoParaEditar?.numero_relatorio || 'RSC_MANUAL',
      url_imagem: finalUrl,
      imagens: finalImagens,
    };

    try {
      await onSave(payload, conflitoParaEditar?.id);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar conflito:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="border-b border-slate-200 dark:border-[#0B384D] pb-3">
            <DialogTitle className="text-lg font-black text-[#072B3B] dark:text-white flex items-center gap-2">
              {conflitoParaEditar ? <Edit2 className="h-5 w-5 text-[#00A3C4]" /> : <Plus className="h-5 w-5 text-[#00A3C4]" />}
              {conflitoParaEditar ? `Editar Conflito ARCIS #${conflitoParaEditar.codigo_conflito}` : 'Novo Conflito ARCIS'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preencha os campos conforme o padrão do Relatório de Serviços de Compatibilização (RSC).
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Código Conflito (#):
              </label>
              <Input
                type="number"
                value={codigoConflito}
                onChange={(e) => setCodigoConflito(parseInt(e.target.value, 10) || 1)}
                className="h-9 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Projeto WCC:
              </label>
              <SelectNative
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="h-9 text-xs font-semibold"
              >
                <option value="">Nenhum Projeto</option>
                {projetos.map((p) => (
                  <option key={`p-opt-${p.id}`} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Status ARCIS:
              </label>
              <SelectNative
                value={statusArcis}
                onChange={(e) => setStatusArcis(e.target.value as StatusConflitoArcis)}
                className="h-9 text-xs font-semibold"
              >
                {STATUS_ARCIS_OPCOES.map((st) => (
                  <option key={`st-opt-${st}`} value={st}>
                    {st}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Tipo Conflito:
              </label>
              <SelectNative
                value={tipoConflito}
                onChange={(e) => setTipoConflito(e.target.value)}
                className="h-9 text-xs font-semibold"
              >
                {TIPOS_CONFLITO_ARCIS_OPCOES.map((tc) => (
                  <option key={`tc-opt-${tc}`} value={tc}>
                    {tc}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Prioridade:
              </label>
              <SelectNative
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeArcis)}
                className="h-9 text-xs font-semibold"
              >
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Baixa">Baixa</option>
                <option value="Urgente">Urgente</option>
              </SelectNative>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Disciplina Principal:
              </label>
              <Input
                value={disciplinaPrincipal}
                onChange={(e) => setDisciplinaPrincipal(e.target.value)}
                placeholder="Ex: ARQUITETURA LEGAL"
                className="h-9 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Disciplinas Envolvidas (separadas por vírgula):
              </label>
              <Input
                value={disciplinasEnvolvidas}
                onChange={(e) => setDisciplinasEnvolvidas(e.target.value)}
                placeholder="Ex: INCÊNDIO, ESTRUTURAL"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Edificação:
              </label>
              <Input
                value={edificacao}
                onChange={(e) => setEdificacao(e.target.value)}
                placeholder="Ex: TORRE"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Pavimentos (vírgula):
              </label>
              <Input
                value={pavimentosText}
                onChange={(e) => setPavimentosText(e.target.value)}
                placeholder="Ex: TÉRREO, 1º PAV"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                Localização:
              </label>
              <Input
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: ÁTRIO, ESCADA"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
              Descrição / Parecer Técnico ARCIS:
            </label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o apontamento ou inconsistência normativa..."
              rows={4}
              className="text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
              Diretriz de Solução (Opcional):
            </label>
            <Textarea
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              placeholder="Proposta ou solução adotada..."
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Seção de Imagem / Foto Técnica do Conflito */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#041A24] border border-slate-200/80 dark:border-[#0B384D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Images className="h-3.5 w-3.5 text-[#00A3C4]" /> Foto Técnica / Print do Conflito
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Você pode colar diretamente com <strong className="text-[#00A3C4]">Ctrl + V</strong>
              </span>
            </div>

            {pasteSuccessMsg && (
              <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                <span>{pasteSuccessMsg}</span>
              </div>
            )}

            {imagemPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-[#0B384D] bg-[#041A24] max-h-52 flex items-center justify-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagemPreview}
                  alt="Pré-visualização do conflito"
                  className="max-h-52 w-auto object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-md transition-all cursor-pointer"
                  title="Remover foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold gap-1.5 h-8 border-[#00A3C4]/40 hover:bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB] cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" /> Selecionar Arquivo
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white gap-1 h-8 cursor-pointer"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> Inserir Link
                  </Button>
                </div>

                {showUrlInput && (
                  <div className="flex items-center gap-2 pt-1 animate-in fade-in-50">
                    <Input
                      type="url"
                      placeholder="https://exemplo.com/imagem.png"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="wcc-gradient"
                      size="sm"
                      onClick={handleAddUrl}
                      className="text-xs h-8 cursor-pointer"
                    >
                      Adicionar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-200 dark:border-[#0B384D] pt-3 flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" variant="wcc-gradient" size="sm" disabled={isSaving} className="text-xs font-bold gap-1.5">
              <Save className="h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Conflito'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
