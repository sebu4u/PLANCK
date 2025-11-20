"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileImage, FileCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Editor } from '@tldraw/tldraw';

interface ExportButtonProps {
  editor: Editor | null;
  boardTitle?: string;
}

export function ExportButton({ editor, boardTitle = 'whiteboard' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportAsPNG = async () => {
    if (!editor) {
      toast.error('Editorul nu este disponibil');
      return;
    }

    setIsExporting(true);
    try {
      // Get shape IDs from current page
      const shapeIds = editor.getCurrentPageShapeIds();
      
      if (shapeIds.size === 0) {
        toast.error('Nu există conținut de exportat');
        setIsExporting(false);
        return;
      }

      // Export as PNG - Tldraw v4 API requires shape IDs array and returns blob
      const { blob } = await editor.toImage([...shapeIds], {
        format: 'png',
        scale: 2,
        background: true,
      });

      if (!blob) {
        throw new Error('Nu s-a putut genera imaginea');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${boardTitle}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Tabla a fost exportată ca PNG!');
    } catch (error) {
      console.error('Export PNG error:', error);
      toast.error('Eroare la exportul PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsSVG = async () => {
    if (!editor) {
      toast.error('Editorul nu este disponibil');
      return;
    }

    setIsExporting(true);
    try {
      // Export as SVG - Tldraw v4 API uses only options object
      const svg = await editor.getSvg({
        scale: 1,
        background: true,
      });

      if (!svg) {
        throw new Error('Nu s-a putut genera SVG-ul');
      }

      // Convert SVG to blob
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${boardTitle}-${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Tabla a fost exportată ca SVG!');
    } catch (error) {
      console.error('Export SVG error:', error);
      toast.error('Eroare la exportul SVG');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || !editor}
          className="border-gray-500/30 text-white hover:bg-gray-700/30 hover:border-gray-500/50 transition-all duration-300 bg-gray-700/60 backdrop-blur-sm"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-gray-900 border-gray-700 text-white min-w-[180px]"
      >
        <DropdownMenuItem
          onClick={exportAsPNG}
          disabled={isExporting}
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
        >
          <FileImage className="w-4 h-4 mr-2" />
          Export PNG
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportAsSVG}
          disabled={isExporting}
          className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
        >
          <FileCode className="w-4 h-4 mr-2" />
          Export SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

