import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Sparkles, Html } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const ALL_NEGATIVES = [
  '想要控制', '恐惧未知', '讨好', '执着', '焦虑', '匮乏感', '抗拒', '委屈', '愤怒',
  '评判', '自责', '担忧未来', '抓取', '无力感', '不想改变', '嫉妒', '傲慢', '想要证明自己',
  '逃避', '内疚', '懊悔', '依赖', '比较', '拖延', '受害者模式', '不配得感', '患得患失'
];
const ALL_POSITIVES = [
  '丰盈 🌾', '安心 🕊️', '自由 🎐', '平静 🌊', '喜悦 ✨', '敞开 👐', '本自具足 ☀️', '无限 🌌',
  '清澈 💧', '无为 🍃', '爱 ❤️', '光 🌟', '接纳 🫂', '流动 〰️', '允许 😌', '感恩 🙏',
  '觉知 👁️', '圆满 🌕', '轻盈 🎈', '臣服 🍂', '觉醒 🌅'
];
const UNIVERSE_QUOTES = [
  "你越是不去控制，事情往往发展得越顺畅。",
  "你的本质是无限的，现在只是云层散开了。",
  "所有的答案都在你内心的平静之中。",
  "不费力，才是宇宙运行的最优解。",
  "当你放下执念，你想要的一切都会自然流向你。",
  "看见即是解脱，你不是你的情绪。",
  "允许一切发生，你便拥有了真正的力量。",
  "你不需要去寻找爱，你本身就是爱。",
  "外面没有别人，只有你自己。"
];

// Fisher-Yates 无偏洗牌
const getRandomItems = (arr, count) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
};

const ChaosEnergyScene = ({ hue, isExploding, step, negatives, positives }) => {
  const outerColor = `hsl(${hue}, 100%, 75%)`;
  const innerColor = `hsl(${hue}, 100%, 40%)`;
  const negPositions = [[1.2, 0.8, 1], [-1.3, -0.5, 1.2], [0.5, 1.2, -1], [-0.8, -1.2, 1], [0, 0, 1.6]];
  const posPositions = [[1.5, 1, 0], [-1.5, -1, 0], [0, 1.8, 0], [0, -1.8, 0], [1.2, -1.2, 1]];

  return (
    <Canvas camera={{ position: [0, 0, 4.5] }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={2} />
      <OrbitControls autoRotate={!isExploding} autoRotateSpeed={2} enableZoom={false} enablePan={false} dampingFactor={0.05} />

      {step !== 'done' && (
        <group>
          <Sphere args={[0.9, 32, 32]}>
            <meshStandardMaterial color={innerColor} emissive={innerColor} emissiveIntensity={0.8} roughness={0.4} />
          </Sphere>
          <Sphere args={[1.25, 64, 64]}>
            <MeshDistortMaterial
              color={outerColor} emissive={outerColor} distort={0.65} speed={3}
              roughness={0.1} metalness={0.8} transparent={true} opacity={0.5}
              blending={THREE.AdditiveBlending} depthWrite={false}
            />
          </Sphere>
          <Sparkles count={100} scale={5} size={4} speed={0.5} opacity={0.9} color="#ffffff" />

          {step === 'idle' && negatives.map((word, i) => (
            <Html key={`neg-${i}`} position={negPositions[i]} center zIndexRange={[100, 0]}>
              <div className="cloud-label-3d">{word}</div>
            </Html>
          ))}
        </group>
      )}

      {step === 'done' && positives.map((word, i) => (
        <Html key={`pos-${i}`} position={posPositions[i]} center zIndexRange={[100, 0]}>
          <div className="pos-word-3d">{word}</div>
        </Html>
      ))}
    </Canvas>
  );
};

function App() {
  const [currentTab, setCurrentTab] = useState('sphere');
  const [releaseStep, setReleaseStep] = useState('idle');
  const [isExploding, setIsExploding] = useState(false);

  const [currentNegatives, setCurrentNegatives] = useState([]);
  const [currentPositives, setCurrentPositives] = useState([]);
  const [currentQuote, setCurrentQuote] = useState('');
  const [sphereColor, setSphereColor] = useState(150);
  const [customEmotion, setCustomEmotion] = useState('');

  const [releaseCount, setReleaseCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInDays, setCheckInDays] = useState(0);
  const [todayStr, setTodayStr] = useState('');

  const [currentStatus, setCurrentStatus] = useState(() => localStorage.getItem('miko_current_status') || '越来越轻盈 🎈');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [notes, setNotes] = useState(() => {
    try {
      const savedNotes = localStorage.getItem('miko_flow_notes');
      return savedNotes ? JSON.parse(savedNotes) : [];
    } catch {
      return [];
    }
  });
  const [newNote, setNewNote] = useState('');

  const explodeTimerRef = useRef(null);

  useEffect(() => { localStorage.setItem('miko_flow_notes', JSON.stringify(notes)); }, [notes]);

  // 清理定时器，防止组件卸载后内存泄漏
  useEffect(() => () => clearTimeout(explodeTimerRef.current), []);

  const togglePin = (id) => { setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)); };
  const deleteNote = (id) => { setNotes(notes.filter(n => n.id !== id)); };
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.id - a.id;
  });

  const initRandomState = useCallback(() => {
    setCurrentNegatives(getRandomItems(ALL_NEGATIVES, 5));
    setCurrentPositives(getRandomItems(ALL_POSITIVES, 5));
    setCurrentQuote(getRandomItems(UNIVERSE_QUOTES, 1)[0]);
    setSphereColor(Math.floor(Math.random() * 360));
  }, []);

  useEffect(() => {
    initRandomState();
    const today = new Date().toLocaleDateString();
    setTodayStr(today);

    const savedCount = parseInt(localStorage.getItem('miko_release_count'), 10);
    setReleaseCount(isNaN(savedCount) ? 0 : savedCount);

    const savedDays = parseInt(localStorage.getItem('miko_checkin_days'), 10);
    const validDays = isNaN(savedDays) ? 0 : savedDays;

    const lastCheckIn = localStorage.getItem('miko_last_checkin');

    if (lastCheckIn === today) {
      setIsCheckedIn(true);
      setCheckInDays(validDays === 0 ? 1 : validDays);
    } else {
      setIsCheckedIn(false);
      setCheckInDays(validDays);
    }
  }, [initRandomState]);

  const triggerRelease = () => {
    setIsExploding(true);
    explodeTimerRef.current = setTimeout(() => {
      setReleaseStep('done');
      setIsExploding(false);
      setReleaseCount(prevCount => {
        const newCount = prevCount + 1;
        localStorage.setItem('miko_release_count', newCount);
        return newCount;
      });
    }, 1500);
  };

  const handleCheckIn = () => {
    if (isCheckedIn) return;
    const today = new Date().toLocaleDateString();
    setIsCheckedIn(true);
    setCheckInDays(prevDays => {
      const newDays = prevDays + 1;
      localStorage.setItem('miko_checkin_days', newDays);
      localStorage.setItem('miko_last_checkin', today);
      return newDays;
    });
  };

  const saveStatus = () => {
    setIsEditingStatus(false);
    localStorage.setItem('miko_current_status', currentStatus);
  };

  const shuffleWords = () => { setCurrentNegatives(getRandomItems(ALL_NEGATIVES, 5)); };
  const handleInjectCustom = () => {
    if (customEmotion.trim()) {
      setCurrentNegatives([customEmotion, ...currentNegatives.slice(0, 4)]);
      setCustomEmotion(''); setReleaseStep('q1');
    }
  };

  const renderSphereTab = () => (
    <div className="tab-content flex-center">
      <div className={`scene-container ${isExploding ? 'dissipate-anim' : ''}`}>
        <ChaosEnergyScene hue={sphereColor} isExploding={isExploding} step={releaseStep} negatives={currentNegatives} positives={currentPositives} />
      </div>

      <div className="ui-overlay">
        {releaseStep === 'done' ? (
          <div className="success-pop fade-in">
            <button className="cute-btn primary" onClick={() => { setReleaseStep('idle'); initRandomState(); }}>继续清理 🍃</button>
            <p className="universe-guide-text">{currentQuote}</p>
          </div>
        ) : (
          <div className="release-dialogue">
            {releaseStep === 'idle' && (
              <div className="fade-in">
                <p className="sphere-text" style={{marginBottom: '10px'}}>拨动能量场... 有戳中你的词吗？</p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <button className="cute-btn primary" onClick={() => setReleaseStep('q1')}>开始释放 💨</button>
                  <button className="cute-btn secondary round-btn" onClick={shuffleWords} title="换一批">🔄</button>
                </div>
                <div className="custom-inject-box">
                  <p className="tiny-hint">或者精准捕获：自己写下执念 👇</p>
                  <div className="inject-input-row">
                    <input
                      className="cute-input" placeholder="例如：不愿意放下..."
                      value={customEmotion} onChange={(e) => setCustomEmotion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInjectCustom()}
                    />
                    <button className="cute-btn primary inject-btn" onClick={handleInjectCustom}>注入 🪄</button>
                  </div>
                </div>
              </div>
            )}

            {releaseStep === 'q1' && (
              <div className="fade-in">
                <p className="sphere-text">第一问：<br/><b>允许这个感觉存在一会儿，可以吗？</b></p>
                <div className="btn-row">
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q2')}>可以 😌</button>
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q1_resist')}>不能，我很抗拒 😣</button>
                </div>
              </div>
            )}
            {releaseStep === 'q1_resist' && (
              <div className="fade-in">
                <p className="sphere-text">没关系。<br/><b>那你能不能允许自己"现在做不到"的这个状态？接纳你的抗拒。</b></p>
                <button className="cute-btn primary" onClick={() => setReleaseStep('q2')}>我可以接纳我的抗拒 🫂</button>
              </div>
            )}
            {releaseStep === 'q2' && (
              <div className="fade-in">
                <p className="sphere-text">第二问：<br/><b>如果可以的话，你能不能把它放下？（哪怕一点点）</b></p>
                <div className="btn-row">
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q3')}>能 🖐️</button>
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q2_heavy')}>不能，它太沉重了 🌑</button>
                </div>
              </div>
            )}
            {releaseStep === 'q2_heavy' && (
              <div className="fade-in">
                <p className="sphere-text">诚实地问自己：<br/><b>你是想继续紧紧抓着这个痛苦，还是想要自由和快乐？</b></p>
                <button className="cute-btn primary" onClick={() => setReleaseStep('q3')}>我想要自由！🎐</button>
              </div>
            )}
            {releaseStep === 'q3' && (
              <div className="fade-in">
                <p className="sphere-text">第三问：<br/><b>那你愿意把它放下吗？</b></p>
                <div className="btn-row">
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q4')}>我愿意 🍃</button>
                  <button className="cute-btn secondary" onClick={() => setReleaseStep('q3_hold')}>说实话，我现在不想放</button>
                </div>
              </div>
            )}
            {releaseStep === 'q3_hold' && (
              <div className="fade-in">
                <p className="sphere-text">如果不放，痛苦会一直存在。<br/><b>你宁愿受苦，还是选择自由？</b></p>
                <button className="cute-btn primary" onClick={() => setReleaseStep('q4')}>我选择自由！✨</button>
              </div>
            )}
            {releaseStep === 'q4' && (
              <div className="fade-in">
                <p className="sphere-text">最后一步：<br/><b>什么时候放下？</b></p>
                <button className="cute-btn explode-btn" onClick={triggerRelease}>就现在！散开吧！ 💨</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDeconstructTab = () => (
    <div className="tab-content fade-in">
      <header className="cute-header compact-header">
        <h1>🪞 解构之镜</h1>
        <p className="sub-title">情绪表象下，是这三大原始欲望</p>
      </header>
      <div className="pixel-card-list compact-list">
        <div className="pixel-card compact-card">
          <h3><span className="card-emoji">🥺</span>想要认可 (Approval)</h3>
          <p><span className="highlight-tag">表象</span> 讨好他人、委屈、渴望被爱与关注。<br/><span className="highlight-tag">真相</span> 试图从外界填补空洞。但你的本质就是完整的爱，外界评价无法定义你。</p>
        </div>
        <div className="pixel-card compact-card">
          <h3><span className="card-emoji">🕹️</span>想要控制 (Control)</h3>
          <p><span className="highlight-tag">表象</span> 愤怒、抗拒现状、试图改变他人。<br/><span className="highlight-tag">真相</span> 用"小我"对抗宇宙的流动。当你停止用力抓取，一切反而会理顺。</p>
        </div>
        <div className="pixel-card compact-card">
          <h3><span className="card-emoji">🛡️</span>想要安全 (Security)</h3>
          <p><span className="highlight-tag">表象</span> 焦虑、恐惧未来、害怕失去一切。<br/><span className="highlight-tag">真相</span> 忘记了自己是无限的觉知。你紧抓不放的，到底是你拥有的，还是囚禁你的？</p>
        </div>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="tab-content fade-in">
      <header className="cute-header"><h1>📝 心流便签</h1></header>
      <div className="note-input-area">
        <textarea placeholder="今天放下了什么执念呢？✍️" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
        <button className="cute-btn primary" onClick={() => {if(newNote.trim()){ setNotes([{ id: Date.now(), text: newNote, pinned: false }, ...notes]); setNewNote(''); }}}>贴上去 📌</button>
      </div>
      <div className="notes-wall">
        {sortedNotes.map(note => (
          <div key={note.id} className={`cute-sticky-note ${note.pinned ? 'pinned' : ''}`}>
            <div className="note-actions">
              <span onClick={() => togglePin(note.id)} title="置顶">{note.pinned ? '🌟' : '📌'}</span>
              <span onClick={() => deleteNote(note.id)} title="删除">🗑️</span>
            </div>
            {note.text}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrackerTab = () => (
    <div className="tab-content fade-in">
      <header className="cute-header"><h1>🌌 能量轨迹</h1></header>
      <div className="checkin-board">
        <div className="date-display">
          <span style={{fontSize: '2rem'}}>🗓️</span>
          <div>
            <p style={{fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold'}}>今天是 {todayStr}</p>
            <h3 style={{fontSize: '1rem', color: '#064e3b', marginTop: '5px'}}>
              累计觉察天数：<span style={{color: '#fbbf24', fontSize: '1.4rem'}}>{checkInDays}</span> 天
            </h3>
          </div>
        </div>
        <button className={`cute-btn ${isCheckedIn ? 'disabled-btn' : 'primary'}`} onClick={handleCheckIn} disabled={isCheckedIn}>
          {isCheckedIn ? '今日已打卡 ✅' : '滴！今日觉察打卡 📅'}
        </button>
      </div>
      <div className="stats-grid">
        <div className="pixel-stat"><p>累计清理云层</p><h2>{releaseCount} <span>次</span></h2></div>
        <div className="pixel-stat edit-stat" onClick={() => !isEditingStatus && setIsEditingStatus(true)}>
          <p>当前状态</p>
          {isEditingStatus ? (
            <input
              className="status-input fade-in"
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              onBlur={saveStatus}
              onKeyDown={(e) => e.key === 'Enter' && saveStatus()}
              autoFocus
            />
          ) : (
            <h2 style={{fontSize: '1.1rem', marginTop:'10px', color: '#065f46'}}>{currentStatus}</h2>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mobile-app-container">
      <main className="main-scroll-area">
        {currentTab === 'sphere' && renderSphereTab()}
        {currentTab === 'deconstruct' && renderDeconstructTab()}
        {currentTab === 'notes' && renderNotesTab()}
        {currentTab === 'tracker' && renderTrackerTab()}
      </main>
      <nav className="cute-bottom-nav">
        <div className={`nav-item ${currentTab === 'sphere' ? 'active' : ''}`} onClick={() => setCurrentTab('sphere')}><span className="nav-icon">🐾</span><span>觉察场</span></div>
        <div className={`nav-item ${currentTab === 'deconstruct' ? 'active' : ''}`} onClick={() => setCurrentTab('deconstruct')}><span className="nav-icon">🪞</span><span>解构</span></div>
        <div className={`nav-item ${currentTab === 'notes' ? 'active' : ''}`} onClick={() => setCurrentTab('notes')}><span className="nav-icon">📝</span><span>便签</span></div>
        <div className={`nav-item ${currentTab === 'tracker' ? 'active' : ''}`} onClick={() => setCurrentTab('tracker')}><span className="nav-icon">🌌</span><span>轨迹</span></div>
      </nav>
    </div>
  )
}

export default App
