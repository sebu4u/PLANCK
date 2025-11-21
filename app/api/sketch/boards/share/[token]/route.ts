import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET - Validate share token and get board
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const { data, error } = await supabase
      .from('sketch_boards')
      .select('id, title, share_token, is_public')
      .eq('share_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Link invalid.' },
        { status: 404 }
      );
    }

    if (!data.is_public) {
      return NextResponse.json(
        { error: 'Tabla nu este publică.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      boardId: data.id,
      title: data.title,
      shareToken: data.share_token,
    });
  } catch (err: any) {
    console.error('Share token validation error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}















































