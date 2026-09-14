"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  title?: string;
  subtitle?: string;
  onViewDetails?: () => void;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
  subtitle,
  onViewDetails,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza índice inicial quando abrir ou mudar props
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (images?.length || 1) - 1)));
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images]);

  // Redefine zoom e posição ao navegar entre fotos
  const handleSelectImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (!images || images.length <= 1) return;
    handleSelectImage((currentIndex + 1) % images.length);
  }, [currentIndex, images, handleSelectImage]);

  const handlePrev = useCallback(() => {
    if (!images || images.length <= 1) return;
    handleSelectImage((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images, handleSelectImage]);

  // Controles de Zoom
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.3, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Rotação
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Download seguro (evita abrir aba em branco com 'This page couldnt load')
  const handleDownload = async () => {
    const currentUrl = images[currentIndex];
    if (!currentUrl) return;

    try {
      setIsDownloading(true);
      const safeTitle = (title || 'apontamento')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .substring(0, 30);
      const fileName = `${safeTitle}_foto_${currentIndex + 1}.webp`;

      if (currentUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = currentUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = await fetch(currentUrl, { mode: 'cors' });
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
      // Fallback sem abrir nova aba
      const link = document.createElement('a');
      link.href = currentUrl;
      link.download = `apontamento_foto_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  // Suporte a Teclado (Esc, Setas, Zoom)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Arraste (Pan) quando a imagem estiver com zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom via Scroll do Mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!isOpen || !mounted || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in-0 duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* BARRA SUPERIOR (HEADER) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex flex-col max-w-[65%] sm:max-w-[75%]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#00A3C4]/30 border border-[#00A3C4]/40 text-[#00C4EB]">
              {currentIndex + 1} / {images.length}
            </span>
            {subtitle && (
              <span className="text-xs font-semibold text-slate-300 truncate max-w-[200px] sm:max-w-[360px]">
                {subtitle}
              </span>
            )}
          </div>
          {title && (
            <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5" title={title}>
              {title}
            </h2>
          )}
        </div>

        {/* BOTÕES DE CONTROLE */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onViewDetails && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="h-8 px-2.5 text-xs bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 hover:border-[#00A3C4] gap-1.5 hidden md:inline-flex cursor-pointer"
              title="Abrir detalhes técnicos do apontamento"
            >
              <Eye className="h-3.5 w-3.5 text-[#00A3C4]" />
              <span>Ver Detalhes</span>
            </Button>
          )}

          {/* Rotação */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRotate}
            className="h-8 w-8 bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Girar imagem 90°"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Zoom Out */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="h-8 w-8 bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-40"
            title="Reduzir zoom (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          {/* Zoom Reset / Indicador */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="h-8 px-2 text-xs font-mono font-bold bg-slate-900/80 border border-slate-700 rounded-md text-slate-200 hover:text-[#00C4EB] hover:bg-slate-800 hover:border-[#00A3C4]/40 flex items-center gap-1 cursor-pointer transition-colors"
            title="Redefinir zoom e posição (0)"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{Math.round(scale * 100)}%</span>
          </button>

          {/* Zoom In */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="h-8 w-8 bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer disabled:opacity-40"
            title="Aumentar zoom (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Download */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-8 w-8 bg-slate-900/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer"
            title="Baixar imagem original para o computador"
          >
            <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
          </Button>

          {/* Fechar Modal */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 cursor-pointer ml-1"
            title="Fechar (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ÁREA CENTRAL: IMAGEM AMPLIADA */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden w-full h-full p-2 sm:p-6"
        onWheel={handleWheel}
        onClick={(e) => {
          // Se clicar no fundo vazio fora da imagem, fecha o modal
          if (e.target === e.currentTarget && scale === 1) {
            onClose();
          }
        }}
      >
        {/* Botão Anterior */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-[#00A3C4] text-white border border-slate-700 hover:border-transparent transition-all shadow-xl backdrop-blur-sm cursor-pointer hover:scale-110"
            title="Foto anterior (Seta esquerda)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Container da Imagem com Transform */}
        <div
          className="relative max-h-[82vh] max-w-[92vw] flex items-center justify-center transition-transform duration-75"
          style={{
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            e.stopPropagation();
            if (scale === 1) {
              handleZoomIn();
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={title || `Foto ampliada #${currentIndex + 1}`}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-none"
            draggable={false}
          />
        </div>

        {/* Botão Próximo */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-[#00A3C4] text-white border border-slate-700 hover:border-transparent transition-all shadow-xl backdrop-blur-sm cursor-pointer hover:scale-110"
            title="Próxima foto (Seta direita)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* BARRA INFERIOR: CARROSSEL DE MINIATURAS E ATALHOS */}
      <div className="flex flex-col items-center gap-2 px-4 py-2.5 bg-gradient-to-t from-black/90 to-transparent z-20">
        {/* Carrossel de Miniaturas se houver mais de 1 foto */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 px-2 scrollbar-thin">
            {images.map((imgUrl, idx) => (
              <button
                key={`lightbox-thumb-${idx}`}
                type="button"
                onClick={() => handleSelectImage(idx)}
                className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-[#00A3C4] ring-2 ring-[#00A3C4]/50 scale-105 opacity-100'
                    : 'border-slate-700 opacity-50 hover:opacity-100 hover:border-slate-500'
                }`}
                title={`Ir para foto ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Dicas de Atalhos */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
          <span className="hidden sm:inline">Use as setas (← →) para navegar</span>
          <span className="hidden sm:inline">•</span>
          <span>Scroll do mouse ou (+ / -) para Zoom</span>
          <span className="hidden sm:inline">•</span>
          <span>(Esc) para fechar</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
