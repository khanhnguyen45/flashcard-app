import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('settings')
    .select('vocabList')
    .eq('id', 1)
    .single();

  if (error || !data) {
    // Nếu chưa có data trên Database, trả về mảng mặc định
    return NextResponse.json([
      { en: "Apple", vi: "Quả táo" },
      { en: "Banana", vi: "Quả chuối" }
    ]);
  }
  return NextResponse.json(data.vocabList);
}

export async function POST(request) {
  try {
    const { vocabList } = await request.json();
    
    // Lưu đè danh sách từ vựng vào dòng có id = 1
    const { error: upsertError } = await supabase
      .from('settings')
      .upsert({ id: 1, vocabList });

    if (upsertError) throw upsertError;

    // Khi đổi đề mới, xóa toàn bộ điểm học sinh
    const { error: deleteError } = await supabase
      .from('scores')
      .delete()
      .neq('id', 0); // Lệnh này giúp xóa toàn bộ các dòng

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi lưu Vocab:", error);
    return NextResponse.json({ error: 'Failed to update vocab' }, { status: 500 });
  }
}
