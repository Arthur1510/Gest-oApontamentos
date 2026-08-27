"use client";

import React, { useState, useRef } from 'react';
import { ConflitoArcis, RelatorioArcisMetadata } from '@/types/arcis';
import { Projeto } from '@/types/apontamento';
import { ArcisStatusBadge } from '@/components/arcis/ArcisStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Images,
} from 'lucide-react';

interface ArcisImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projetos: Projeto[];
  defaultProjetoId?: string;
  conflitosExistentes?: ConflitoArcis[];
  onImportSuccess: (conflitos: ConflitoArcis[], metadata: RelatorioArcisMetadata) => Promise<void> | void;
}

export function ArcisImportModal({
  isOpen,
  onClose,
  projetos,
  defaultProjetoId,
  conflitosExistentes = [],
  onImportSuccess,
}: ArcisImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>(defaultProjetoId || '');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<RelatorioArcisMetadata | null>(null);
  const [selectedConflictCodes, setSelectedConflictCodes] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen && defaultProjetoId) {
      setSelectedProjetoId(defaultProjetoId);
    }
  }, [isOpen, defaultProjetoId]);

  const existingForSelectedProject = React.useMemo(() => {
    if (!conflitosExistentes) return [];
    return conflitosExistentes.filter((c) =>
      selectedProjetoId ? c.projeto_id === selectedProjetoId : true
    );
  }, [conflitosExistentes, selectedProjetoId]);

  const stats = React.useMemo(() => {
    if (!parsedData) return { novos: 0, atualizacoes: 0, statusAlterados: 0 };
    let novos = 0;
    let atualizacoes = 0;
    let statusAlterados = 0;

    parsedData.conflitos.forEach((c) => {
      const existing = existingForSelectedProject.find((e) => e.codigo_conflito === c.codigo_conflito);
      if (existing) {
        atualizacoes++;
        if (existing.status_arcis !== c.status_arcis) {
          statusAlterados++;
        }
      } else {
        novos++;
      }
    });

    return { novos, atualizacoes, statusAlterados };
  }, [parsedData, existingForSelectedProject]);

  const resetState = () => {
    setSelectedFile(null);
    setParsedData(null);
    setSelectedConflictCodes([]);
    setSelectedProjetoId(defaultProjetoId || '');
    setErrorMsg(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor selecione um arquivo de relatório PDF da ARCIS (.pdf).');
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      let metadata: RelatorioArcisMetadata | null = null;

      // 1. Processamento direto no navegador (Client-Side)
      // Vantagem crucial para a Vercel: o arquivo PDF não é enviado pela rede como payload HTTP,
      // contornando o limite estrito de 4.5 MB ("Request Entity Too Large / 413") e timeouts!
      try {
        const { parseArcisPdfClientSide } = await import('@/lib/arcis-browser-parser');
        metadata = await parseArcisPdfClientSide(file, selectedProjetoId);
      } catch (browserErr) {
        console.warn('Processamento no navegador falhou, recorrendo à rota do servidor:', browserErr);
      }

      // 2. Se o processamento local falhar e o arquivo couber no limite da Vercel, usar rota da API
      if (!metadata) {
        if (file.size > 4.5 * 1024 * 1024) {
          throw new Error(
            'O arquivo PDF excede o limite de 4.5 MB da Vercel e o processamento local no navegador encontrou um erro. Tente otimizar o PDF ou reduzir o número de páginas.'
          );
        }

        const formData = new FormData();
        formData.append('file', file);
        if (selectedProjetoId) {
          formData.append('projetoId', selectedProjetoId);
        }

        const res = await fetch('/api/arcis/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          if (res.status === 413) {
            throw new Error(
              'O arquivo PDF excede o limite de tamanho aceito pelo servidor na Vercel (4.5 MB). Tente otimizar o PDF ou reduzir o número de páginas.'
            );
          }
          const rawText = await res.text();
          let serverErrMsg = `Erro ${res.status}: ${res.statusText}`;
          try {
            const errJson = JSON.parse(rawText);
            if (errJson.error) serverErrMsg = errJson.error;
          } catch {
            serverErrMsg = rawText.slice(0, 150) || serverErrMsg;
          }
          throw new Error(serverErrMsg);
        }

        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Falha ao processar PDF no servidor.');
        }

        metadata = json.data as RelatorioArcisMetadata;
      }

      setParsedData(metadata);
      // Selecionar todos por padrão
      setSelectedConflictCodes(metadata.conflitos.map((c) => c.codigo_conflito));

      // Tentar auto-selecionar projeto correspondente pelo nome
      const matchedProj = projetos.find(
        (p) =>
          p.nome.toLowerCase().includes(metadata!.empreendimento.toLowerCase()) ||
          metadata!.empreendimento.toLowerCase().includes(p.nome.toLowerCase())
      );
      if (matchedProj && !selectedProjetoId) {
        setSelectedProjetoId(matchedProj.id);
      }
    } catch (err: unknown) {
      console.error('Erro na extração do PDF:', err);
      const msg = err instanceof Error ? err.message : 'Erro na leitura do PDF';
      setErrorMsg(`Não foi possível processar o relatório: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSelectAll = () => {
    if (!parsedData) return;
    if (selectedConflictCodes.length === parsedData.conflitos.length) {
      setSelectedConflictCodes([]);
    } else {
      setSelectedConflictCodes(parsedData.conflitos.map((c) => c.codigo_conflito));
    }
  };

  const toggleConflict = (code: number) => {
    setSelectedConflictCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    const conflictsToImport = parsedData.conflitos
      .filter((c) => selectedConflictCodes.includes(c.codigo_conflito))
      .map((c) => ({
        ...c,
        projeto_id: selectedProjetoId || c.projeto_id || null,
        projetos: selectedProjetoId
          ? { nome: projetos.find((p) => p.id === selectedProjetoId)?.nome || parsedData.empreendimento }
          : null,
      }));

    try {
      setIsImporting(true);
      await onImportSuccess(conflictsToImport, parsedData);
      resetState();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar conflitos importados:', err);
      setErrorMsg('Falha ao gravar os conflitos no sistema.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <DialogHeader className="border-b border-slate-200 dark:border-[#0B384D] pb-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-black text-[#00A3C4] dark:text-[#00C4EB] uppercase tracking-wider">
            <UploadCloud className="h-4 w-4" /> Importador Inteligente ARCIS
          </div>
          <DialogTitle className="text-xl font-black text-[#072B3B] dark:text-white">
            Importar Relatório de Compatibilização (PDF RSC)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Carregue o arquivo exportado pela ARCIS (ex: RSC_WCC_CONSTRUTORA_ALTAMIRA_47_20260816.pdf) para extrair todos os conflitos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {/* 1. Dropzone de Upload de Arquivo */}
        {!parsedData && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#00A3C4]/40 hover:border-[#00A3C4] dark:border-[#00A3C4]/30 dark:hover:border-[#00A3C4] rounded-2xl p-8 text-center cursor-pointer transition-all bg-[#00A3C4]/5 dark:bg-[#00A3C4]/10 hover:bg-[#00A3C4]/10 flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 rounded-2xl bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] shadow-xs">
                {isParsing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#072B3B] dark:text-white">
                  {isParsing ? 'Processando e lendo páginas do relatório...' : 'Clique para selecionar ou arraste o PDF RSC aqui'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Formatos aceitos: Documentos PDF do padrão Grupo ARCIS
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. Visualização dos Dados Extraídos */}
        {parsedData && (
          <div className="space-y-4 animate-in fade-in-50">
            {/* Metadados da Capa Extraídos */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#041A24] border border-slate-200 dark:border-[#0B384D] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Empreendimento
                </span>
                <span className="font-extrabold text-[#00A3C4] dark:text-[#00C4EB] text-sm block mt-0.5">
                  {parsedData.empreendimento}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cliente
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block mt-0.5 truncate">
                  {parsedData.cliente}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Data Relatório
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {parsedData.data_relatorio}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Conflitos
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
                  {parsedData.conflitos.length} de {parsedData.total_conflitos}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fotos Técnicas
                </span>
                <span className="font-black text-[#00A3C4] dark:text-[#00C4EB] text-sm block mt-0.5 flex items-center gap-1">
                  <Images className="h-3.5 w-3.5" />
                  {parsedData.conflitos.filter((c) => !!c.url_imagem).length} WebP
                </span>
              </div>
            </div>

            {/* Vínculo de Projeto */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D]">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-[#00A3C4]" />
                <label htmlFor="import-project-select" className="text-xs font-bold text-[#072B3B] dark:text-white uppercase tracking-wider">
                  Vincular ao Projeto WCC:
                </label>
              </div>

              <div className="w-full sm:w-64">
                <SelectNative
                  id="import-project-select"
                  value={selectedProjetoId}
                  onChange={(e) => setSelectedProjetoId(e.target.value)}
                  className="h-9 text-xs font-bold rounded-xl"
                >
                  <option value="">Nenhum (Usar nome do PDF)</option>
                  {projetos.map((p) => (
                    <option key={`proj-opt-${p.id}`} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </SelectNative>
              </div>
            </div>

            {/* Tabela de Conflitos Detectados com Checkbox */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Selecione os conflitos para sincronizar ({selectedConflictCodes.length}/{parsedData.conflitos.length}):
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-[#00A3C4] h-7 cursor-pointer"
                >
                  {selectedConflictCodes.length === parsedData.conflitos.length
                    ? 'Desmarcar Todos'
                    : 'Selecionar Todos'}
                </Button>
              </div>

              {/* Banner de Sincronização Inteligente */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B384D] text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                  <RefreshCw className="h-3.5 w-3.5 text-[#00A3C4]" />
                  <span>
                    Detecção inteligente: {stats.novos > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{stats.novos} novos</span>}
                    {stats.novos > 0 && stats.atualizacoes > 0 && ' • '}
                    {stats.atualizacoes > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                        {stats.atualizacoes} já cadastrados
                        {stats.statusAlterados > 0 && ` (${stats.statusAlterados} com novo status)`}
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {stats.atualizacoes > 0 ? 'Conflitos existentes serão atualizados (sem duplicatas)' : 'Todos serão cadastrados'}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parsedData.conflitos.map((c) => {
                  const isSelected = selectedConflictCodes.includes(c.codigo_conflito);
                  const existingConflict = existingForSelectedProject.find(
                    (e) => e.codigo_conflito === c.codigo_conflito
                  );
                  const isUpdate = !!existingConflict;
                  const hasStatusChanged = isUpdate && existingConflict.status_arcis !== c.status_arcis;

                  return (
                    <div
                      key={`parsed-c-${c.codigo_conflito}`}
                      onClick={() => toggleConflict(c.codigo_conflito)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#00A3C4]/10 border-[#00A3C4]/40 dark:bg-[#00A3C4]/20'
                          : 'bg-white dark:bg-[#072B3B] border-slate-200 dark:border-[#0B384D] opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded text-[#00A3C4] cursor-pointer"
                      />

                      {c.url_imagem && (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-[#0B384D] bg-[#041A24] shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.url_imagem}
                            alt={`Print #${c.codigo_conflito}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-[#072B3B]/85 text-[8px] text-[#00C4EB] text-center font-bold py-0.5">
                            WEBP
                          </div>
                        </div>
                      )}

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-[#072B3B] text-white">
                              #{c.codigo_conflito}
                            </span>
                            <span className="font-bold text-xs text-[#072B3B] dark:text-white">
                              {c.disciplina_principal}
                            </span>
                            {c.disciplinas_envolvidas.length > 0 && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                → {c.disciplinas_envolvidas.join(', ')}
                              </span>
                            )}

                            {/* Badge de Reconhecimento */}
                            {isUpdate ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                <RefreshCw className="h-2.5 w-2.5" /> Atualização #{c.codigo_conflito}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <Plus className="h-2.5 w-2.5" /> Novo
                              </span>
                            )}
                          </div>

                          <ArcisStatusBadge status={c.status_arcis} size="sm" />
                        </div>

                        {/* Indicação de mudança de status se houver */}
                        {hasStatusChanged && (
                          <div className="text-[11px] font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md border border-amber-300/40">
                            <span>Status anterior: <span className="line-through opacity-80">{existingConflict.status_arcis}</span></span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Novo: {c.status_arcis}</span>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {c.descricao}
                        </p>

                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>{c.tipo_conflito}</span>
                          <span>•</span>
                          <span>{c.localizacao || c.local_edificacao || 'Local Geral'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between border-t border-slate-200 dark:border-[#0B384D] pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="text-xs cursor-pointer"
          >
            Cancelar
          </Button>

          {parsedData && (
            <Button
              variant="wcc-gradient"
              size="sm"
              onClick={handleConfirmImport}
              disabled={selectedConflictCodes.length === 0 || isImporting}
              className="text-xs font-bold gap-2 cursor-pointer shadow-md"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Otimizando imagens e gravando no Supabase...
                </>
              ) : stats.atualizacoes > 0 ? (
                <>
                  <RefreshCw className="h-4 w-4" /> Sincronizar {selectedConflictCodes.length} Conflitos
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Importar {selectedConflictCodes.length} Conflitos
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
