'use client';

import React, { useEffect } from 'react';
import { X, ZoomIn, Check, BookOpen } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  author?: string;
  onSelect?: () => void;
  selectLabel?: string;
}

export default function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  author,
  onSelect,
  selectLabel = 'Selecionar esta obra',
}: ImageLightboxModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-zinc-950/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200"
      >
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          title="Fechar visualização"
          className="absolute top-3.5 right-3.5 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Artwork Header Tag */}
        <div className="absolute top-3.5 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-xs text-amber-300 font-medium">
          <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
          <span>Arte da Capa</span>
        </div>

        {/* Big Artwork Viewer */}
        <div className="w-full max-h-[68vh] p-6 pt-12 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[58vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-48 h-72 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 p-4 text-center">
              <BookOpen className="w-12 h-12 mb-3 text-zinc-600" />
              <p className="text-xs font-medium">Sem imagem de capa disponível</p>
            </div>
          )}
        </div>

        {/* Bottom Details Bar */}
        <div className="w-full p-5 bg-zinc-900/90 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="min-w-0 flex-1">
            <h4 className="font-serif font-bold text-base text-zinc-100 truncate">
              {title || 'Sem título'}
            </h4>
            {author && (
              <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                {author}
              </p>
            )}
          </div>

          {onSelect && (
            <button
              onClick={() => {
                onSelect();
                onClose();
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all flex-shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{selectLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
