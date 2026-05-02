"use client";
import { useState, useEffect } from "react";
import styles from "../page.module.css";

export default function TeacherDashboard() {
  const [vocabInput, setVocabInput] = useState("");
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScores();
    fetchVocab();
  }, []);

  const fetchScores = async () => {
    const res = await fetch("/api/scores", { cache: "no-store" });
    const data = await res.json();
    setScores(data);
  };

  const fetchVocab = async () => {
    const res = await fetch("/api/vocab", { cache: "no-store" });
    const data = await res.json();
    const formattedString = data.map(v => `${v.en} - ${v.vi}`).join("\n");
    setVocabInput(formattedString);
  };

  const handleUpdateVocab = async () => {
    if (!vocabInput.trim()) return;
    
    if (scores.length > 0) {
      const confirmReset = window.confirm("CẢNH BÁO: Việc thay đổi hoặc chỉnh sửa bộ từ vựng sẽ tự động XÓA TOÀN BỘ bảng điểm hiện tại để học sinh bắt đầu thi lại từ đầu. Bạn có chắc chắn muốn lưu?");
      if (!confirmReset) return;
    }

    setLoading(true);
    
    const lines = vocabInput.split("\n");
    const parsedVocab = lines.map(line => {
      const firstDashIndex = line.indexOf("-");
      if (firstDashIndex !== -1) {
        return { 
          en: line.substring(0, firstDashIndex).trim(), 
          vi: line.substring(firstDashIndex + 1).trim() 
        };
      }
      return null;
    }).filter(Boolean);

    if (parsedVocab.length === 0) {
      alert("Định dạng sai! Vui lòng nhập dạng: Tiếng Anh - Tiếng Việt");
      setLoading(false);
      return;
    }

    await fetch("/api/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabList: parsedVocab })
    });
    
    alert("Đã lưu bộ từ vựng thành công!");
    fetchScores(); 
    fetchVocab(); 
    setLoading(false);
  };

  return (
    <div className={styles.container} style={{ flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
      <h1 style={{ marginBottom: 20, fontSize: '1.8rem' }}>👨‍🏫 Quản Trị Giáo Viên</h1>
      
      <div className={styles.teacherSplit}>
        <div className={styles.teacherPanel}>
          <h3 style={{ margin: '0 0 12px 0' }}>Quản Lý Bộ Từ Vựng</h3>
          <p className={styles.hintText}>Định dạng: <code>Tiếng Anh - Tiếng Việt</code></p>
          <textarea
            value={vocabInput}
            onChange={(e) => setVocabInput(e.target.value)}
            placeholder="Apple - Quả táo&#10;Banana - Quả chuối"
            style={{
              width: '100%', height: 300, marginTop: 12, padding: 16, fontSize: '1rem',
              background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', resize: 'vertical'
            }}
          />
          <button 
            onClick={handleUpdateVocab}
            disabled={loading}
            style={{
              marginTop: 16, padding: '14px', background: 'var(--accent-primary)', fontSize: '1rem',
              color: 'black', fontWeight: 'bold', borderRadius: 'var(--radius-sm)', width: '100%',
              cursor: 'pointer'
            }}
          >
            {loading ? "Đang lưu..." : "Cập Nhật Bộ Từ Vựng"}
          </button>
        </div>

        <div className={styles.teacherPanel}>
          <h3 style={{ margin: '0 0 16px 0' }}>Lịch Sử Nộp Bài Gần Nhất</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scores.length === 0 ? (
              <p className={styles.hintText}>Chưa có học sinh nào làm bài.</p>
            ) : (
              scores.sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)).map((s, idx) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{s.studentName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {new Date(s.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: s.score === s.total ? 'var(--success)' : 'var(--accent-primary)' }}>
                      {s.score} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {s.total}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 2 }}>⏱ {s.totalTime}s</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
