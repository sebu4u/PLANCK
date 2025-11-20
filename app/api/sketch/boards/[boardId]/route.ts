import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Get board by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const { data, error } = await supabase
      .from('sketch_boards')
      .select('id, title, share_token, created_at, updated_at, is_public, user_id')
      .eq('id', boardId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch board:', error);
      return NextResponse.json(
        { error: 'Tabla nu a fost găsită.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ board: data });
  } catch (err: any) {
    console.error('Get board API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}

// PATCH - Update board (title, etc)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await req.json();
    const { title } = body || {};

    if (!title) {
      return NextResponse.json(
        { error: 'Date lipsă.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sketch_boards')
      .update({ title: title.slice(0, 200) })
      .eq('id', boardId)
      .select('id, title, updated_at')
      .single();

    if (error || !data) {
      console.error('Failed to update board:', error);
      return NextResponse.json(
        { error: 'Nu am putut actualiza tabla.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ board: data });
  } catch (err: any) {
    console.error('Update board API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}

// DELETE - Delete board
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const { error } = await supabase
      .from('sketch_boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      console.error('Failed to delete board:', error);
      return NextResponse.json(
        { error: 'Nu am putut șterge tabla.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Delete board API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}





























