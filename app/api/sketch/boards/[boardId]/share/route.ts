import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// POST - Generate new share token (or get existing)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    // Check if board exists
    const { data: board, error: fetchError } = await supabase
      .from('sketch_boards')
      .select('id, share_token')
      .eq('id', boardId)
      .single();

    if (fetchError || !board) {
      return NextResponse.json(
        { error: 'Tabla nu a fost găsită.' },
        { status: 404 }
      );
    }

    // Return existing share token
    return NextResponse.json({
      shareToken: board.share_token,
      shareUrl: `${req.nextUrl.origin}/sketch/board/${boardId}`,
    });
  } catch (err: any) {
    logger.error('Share token API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}

















































