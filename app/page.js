"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function StudentApp() {
  const [gameState, setGameState] = useState("setup"); 
  const [studentName, setStudentName] = useState("");
  const [vocabList, setVocabList] = useState([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(6);
  const [userInput, setUserInput] = useState("");
  const [answers, setAnswers] = useState([]); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  
  const userInputRef = useRef("");
  const totalTimeRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/api/vocab")
      .then(r => r.json())
      .then(data => setVocabList(data));
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      if (inputRef.current) inputRef.current.focus();

      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleNextWord();
      }
    }
  }, [gameState, timeLeft]);

  const handleStart = () => {
    if (!studentName.trim()) return alert("Vui lòng nhập tên của bạn trước khi bắt đầu!");
    if (vocabList.length === 0) return alert("Giáo viên chưa cập nhật danh sách từ vựng!");
    
    setGameState("playing");
    setCurrentIndex(0);
    setTimeLeft(6);
    setAnswers([]);
    setUserInput("");
    userInputRef.current = "";
    totalTimeRef.current = 0;
  };

  const handleNextWord = () => {
    const currentWord = vocabList[currentIndex];
    const actualInput = userInputRef.current.trim();
    
    const isCorrect = actualInput.toLowerCase() === currentWord.en.toLowerCase();
    
    const timeTaken = 6 - timeLeft;
    totalTimeRef.current += timeTaken;

    const newAnswers = [...answers, {
      vi: currentWord.vi,
      expected: currentWord.en,
      actual: actualInput,
      correct: isCorrect
    }];
    
    setAnswers(newAnswers);

    if (currentIndex + 1 < vocabList.length) {
      setCurrentIndex(c => c + 1);
      setTimeLeft(6);
      setUserInput("");
      userInputRef.current = "";
    } else {
      finishGame(newAnswers);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNextWord();
    }
  };

  const finishGame = async (finalAnswers) => {
    setGameState("result");
    setIsLeaderboardLoading(true);
    const correctCount = finalAnswers.filter(a => a.correct).length;
    const finalTotalTime = totalTimeRef.current;
    
    await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName,
        score: correctCount,
        total: vocabList.length,
        totalTime: finalTotalTime,
        detailedResults: finalAnswers
      })
    });

    const res = await fetch("/api/scores");
    const allScores = await res.json();
    
    const userStats = {};
    allScores.forEach(s => {
      const nameKey = s.studentName.trim().toUpperCase();
      if (!userStats[nameKey]) {
        userStats[nameKey] = {
          name: s.studentName,
          bestScore: s.score,
          bestTime: s.totalTime || 9999,
          attempts: 1
        };
      } else {
        userStats[nameKey].attempts += 1;
        if (s.score > userStats[nameKey].bestScore) {
          userStats[nameKey].bestScore = s.score;
          userStats[nameKey].bestTime = s.totalTime || 9999;
        } else if (s.score === userStats[nameKey].bestScore) {
           if ((s.totalTime || 9999) < userStats[nameKey].bestTime) {
              userStats[nameKey].bestTime = s.totalTime || 9999;
           }
        }
      }
    });

    const sortedBoard = Object.values(userStats).sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore; 
      return a.bestTime - b.bestTime; 
    });

    setLeaderboard(sortedBoard);
    setIsLeaderboardLoading(false);
  };

  if (gameState === "setup") {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <div style={{ background: 'var(--bg-surface)', padding: '40px 30px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
          <h1 style={{ marginBottom: 16, fontSize: '2.5rem' }}>⚡ Flashcard</h1>
          <p className={styles.hintText} style={{ marginBottom: 32, fontSize: '1rem' }}>Kiểm tra từ vựng. Bạn có đúng <strong>6 giây</strong> cho mỗi từ.</p>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 10, color: 'var(--text-secondary)' }}>Nhập Tên Học Sinh:</label>
            <input 
              type="text" 
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Họ và tên..."
              style={{
                width: '100%', padding: '16px', fontSize: '1.2rem',
                background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                color: 'white', borderRadius: 'var(--radius-sm)', marginBottom: 24, outline: 'none'
              }}
            />
          </div>

          <button 
            onClick={handleStart}
            style={{
              width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 'bold',
              background: 'var(--accent-primary)', color: '#000', borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-glow)', cursor: 'pointer', border: 'none'
            }}
          >
            Bắt Đầu Dò Bài
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    const currentWord = vocabList[currentIndex];
    const progressPercent = (timeLeft / 6) * 100;
    
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 20 }}>
        <div style={{ position: 'absolute', top: 20, left: 20, fontSize: '1rem', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
          👤 {studentName}
        </div>
        <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '1rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
          {currentIndex + 1} / {vocabList.length}
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '40px 30px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 700, textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '3rem', margin: '0 0 30px 0', color: 'var(--text-primary)', fontWeight: 'bold' }}>
            {currentWord.vi}
          </h2>

          <input 
            ref={inputRef}
            type="text" 
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              userInputRef.current = e.target.value;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Gõ tiếng Anh..."
            style={{
              width: '100%', padding: '20px', fontSize: '1.8rem', textAlign: 'center',
              background: 'var(--bg-main)', border: `2px solid ${timeLeft <= 2 ? 'var(--error)' : 'var(--accent-primary)'}`,
              color: 'white', borderRadius: 'var(--radius-md)', marginBottom: 24,
              outline: 'none', boxShadow: timeLeft <= 2 ? '0 0 15px rgba(244, 63, 94, 0.4)' : '0 0 15px rgba(56, 189, 248, 0.2)',
              transition: 'border 0.3s ease, box-shadow 0.3s ease'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft <= 2 ? 'var(--error)' : 'var(--text-primary)', width: 30 }}>
              {timeLeft}s
            </div>
            <div style={{ flex: 1, height: 12, background: 'var(--bg-main)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', width: `${progressPercent}%`, 
                background: timeLeft <= 2 ? 'var(--error)' : 'var(--accent-primary)',
                transition: 'width 1s linear, background 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "result") {
    const correctCount = answers.filter(a => a.correct).length;
    return (
      <div className={`${styles.container} ${styles.responsiveSplit}`}>
        
        {/* Left */}
        <div className={styles.resultLeft}>
          <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>Kết Quả Của Bạn</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: 20 }}>👤 <strong>{studentName}</strong> | ⏱ <strong>{totalTimeRef.current}s</strong></p>
          
          <div className={styles.scoreText} style={{ 
            fontSize: '4rem', fontWeight: 'bold', color: correctCount === vocabList.length ? 'var(--success)' : 'var(--accent-primary)',
            marginBottom: 30, textShadow: 'var(--shadow-glow)'
          }}>
            {correctCount} <span style={{ fontSize: '2rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {vocabList.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {answers.map((ans, idx) => (
              <div key={idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', background: 'var(--bg-main)', 
                borderLeft: `4px solid ${ans.correct ? 'var(--success)' : 'var(--error)'}`,
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 4 }}>{ans.vi}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đúng: <span style={{ color: 'var(--success)' }}>{ans.expected}</span></div>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.1rem', fontWeight: 'bold',
                    color: ans.correct ? 'var(--success)' : 'var(--error)',
                    textDecoration: ans.correct ? 'none' : 'line-through'
                  }}>
                    {ans.actual || "(bỏ trống)"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setGameState("setup")}
            style={{
              marginTop: 30, padding: '16px', fontSize: '1.1rem', fontWeight: 'bold',
              background: 'var(--accent-primary)', color: 'black', border: 'none',
              borderRadius: 'var(--radius-full)', cursor: 'pointer', width: '100%'
            }}
          >
            Làm Lại Lần Nữa
          </button>
        </div>

        {/* Right */}
        <div className={styles.resultRight}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 24, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 Bảng Xếp Hạng
          </h2>
          
          {isLeaderboardLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--accent-primary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
              <div>Đang tải dữ liệu và tính toán thứ hạng...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaderboard.length === 0 ? <p>Chưa có dữ liệu.</p> : leaderboard.map((user, idx) => (
                <div key={idx} style={{ 
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-main)', 
                  border: idx === 0 ? '1px solid var(--warning)' : '1px solid var(--border-color)',
                  padding: '16px', borderRadius: 'var(--radius-md)', position: 'relative'
                }}>
                  {idx === 0 && <span style={{ position: 'absolute', top: -10, right: -10, fontSize: '1.5rem' }}>👑</span>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: '1.1rem' }}>{idx + 1}. {user.name}</strong>
                    <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success)' }}>{user.bestScore}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span>Nhanh nhất: <strong>{user.bestTime}s</strong></span>
                    <span>Đã chơi: {user.attempts} lần</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }
}
