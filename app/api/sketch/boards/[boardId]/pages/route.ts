import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Get all pages for a board
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    // Verify board exists
    const { data: board, error: boardError } = await supabase
      .from('sketch_boards')
      .select('id, is_public')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Tabla nu a fost găsită.' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('sketch_board_pages')
      .select('id, page_id, snapshot, updated_at')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch pages:', error);
      return NextResponse.json(
        { error: 'Nu am putut încărca paginile.' },
        { status: 500 }
      );
    }

    const pagesWithThumbnailMetadata = (data || []).map((page, index) => {
      const snapshot = page.snapshot;
      let hasShapes = false;
      let shapeCount = 0;

      if (snapshot && typeof snapshot === 'object' && snapshot.store) {
        const records = Object.values(snapshot.store as Record<string, any>);
        for (const record of records) {
          if (record && record.typeName === 'shape' && record.parentId === page.page_id) {
            hasShapes = true;
            shapeCount += 1;
          }
        }
      }

      return {
        id: page.id,
        page_id: page.page_id,
        snapshot: page.snapshot,
        updated_at: page.updated_at,
        hasShapes,
        shapeCount,
        index,
      };
    });

    return NextResponse.json({ pages: pagesWithThumbnailMetadata });
  } catch (err: any) {
    console.error('Get pages API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}

// POST - Save/update page snapshot
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await req.json();
    const { pageId, snapshot } = body || {};

    if (!pageId || !snapshot) {
      return NextResponse.json(
        { error: 'Date lipsă.' },
        { status: 400 }
      );
    }

    // Verify board exists
    const { data: board, error: boardError } = await supabase
      .from('sketch_boards')
      .select('id, is_public')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Tabla nu a fost găsită.' },
        { status: 404 }
      );
    }

    // Upsert page snapshot
    const { data, error } = await supabase
      .from('sketch_board_pages')
      .upsert(
        {
          board_id: boardId,
          page_id: pageId,
          snapshot: snapshot,
        },
        {
          onConflict: 'board_id,page_id',
        }
      )
      .select('id, page_id, updated_at')
      .single();

    if (error) {
      console.error('Failed to save page:', error);
      return NextResponse.json(
        { error: 'Nu am putut salva pagina.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ page: data });
  } catch (err: any) {
    console.error('Save page API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}


















