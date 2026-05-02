import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('submittedAt', { ascending: false });

  if (error) {
    console.error("Lỗi tải điểm:", error);
    return NextResponse.json([]);
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const { studentName, score, total, totalTime, detailedResults } = await request.json();
    
    const { error } = await supabase
      .from('scores')
      .insert([
        {
          studentName,
          score,
          total,
          totalTime,
          detailedResults, // Supabase tự động lưu JSON
          submittedAt: new Date().toISOString()
        }
      ]);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi lưu điểm:", error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
