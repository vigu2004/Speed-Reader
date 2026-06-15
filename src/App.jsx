import { useState, useEffect, useRef, useCallback } from 'react';
import { parseBook } from './parseBook';
import './App.css';

function App() {
  const [book, setBook] = useState(null);
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [chapters, setChapters] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      const parsed = await parseBook(file);
      setBook(parsed);
      setWords(parsed.words);
      setChapters(parsed.chapters);
      setIndex(parsed.chapterStart);
      setPlaying(false);
    } catch (e) {
      console.error('Failed to parse book:', e);
    }
    setLoading(false);
  }, []);

  const onFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const togglePlay = useCallback(() => {
    setPlaying(p => !p);
  }, []);

  useEffect(() => {
    if (playing && words.length > 0) {
      const ms = 60000 / wpm;
      intervalRef.current = setInterval(() => {
        setIndex(i => {
          if (i >= words.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }, ms);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, wpm, words.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (!book) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        setIndex(i => Math.min(i + 1, words.length - 1));
      } else if (e.code === 'ArrowLeft') {
        setIndex(i => Math.max(i - 1, 0));
      } else if (e.code === 'ArrowUp') {
        setWpm(w => Math.min(w + 50, 1500));
      } else if (e.code === 'ArrowDown') {
        setWpm(w => Math.max(w - 50, 50));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [book, words.length, togglePlay]);

  const currentChapter = chapters.length > 0
    ? [...chapters].reverse().find(ch => index >= ch.wordStart)
    : null;

  const goToChapter = (dir) => {
    if (!chapters.length) return;
    const ci = chapters.findIndex(ch => ch === currentChapter);
    const next = ci + dir;
    if (next >= 0 && next < chapters.length) {
      setIndex(chapters[next].wordStart);
    }
  };

  const progress = words.length > 0 ? (index / (words.length - 1)) * 100 : 0;

  const reset = () => {
    setBook(null);
    setWords([]);
    setIndex(0);
    setPlaying(false);
    setChapters([]);
  };

  if (!book) {
    return (
      <div className="app">
        <div className="upload-screen">
          <h1>Speed Reader</h1>
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {loading ? (
              <span>Parsing...</span>
            ) : (
              <>
                <span>Drop a book here or click to browse</span>
                <span className="hint">.txt, .epub, or .pdf</span>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.epub,.pdf"
            onChange={onFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="progress-bar" style={{ width: `${progress}%` }} />

      <div className="meta">
        <span className="title">{book.title}</span>
      </div>

      <div className="new-book-btn">
        <button onClick={reset}>New Book</button>
      </div>

      <div className="reader" onClick={togglePlay}>
        <div className={`word-display ${!playing && index === 0 ? 'empty' : ''}`}>
          {words[index] || ''}
        </div>

        <div className="pause-hint">
          {playing ? '' : 'space to start'}
        </div>

        <div className="controls" onClick={(e) => e.stopPropagation()}>
          <div className="chapter-nav">
            <button onClick={() => goToChapter(-1)}>&#8592;</button>
            <span className="chapter-label">
              {currentChapter?.title || 'Start'}
            </span>
            <button onClick={() => goToChapter(1)}>&#8594;</button>
          </div>

          <button onClick={togglePlay} className={playing ? 'active' : ''}>
            {playing ? 'Pause' : 'Play'}
          </button>

          <div className="speed-control">
            <label>WPM</label>
            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
            />
            <span className="speed-value">{wpm} wpm</span>
          </div>

          <button onClick={() => setIndex(i => Math.max(0, i - 50))}>-50w</button>
          <button onClick={() => setIndex(i => Math.min(words.length - 1, i + 50))}>+50w</button>
        </div>
      </div>
    </div>
  );
}

export default App;
