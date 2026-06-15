import ePub from 'epubjs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

const CHAPTER_PATTERN = /^(chapter\s+(\d+|[ivxlc]+|one|two|three|four|five|six|seven|eight|nine|ten))/i;
const SKIP_PATTERN = /^(table of contents|contents|preface|foreword|introduction|acknowledgment|dedication|copyright|title page|about|prologue|front matter)/i;

function splitWords(text) {
  return text
    .replace(/\n{2,}/g, '\n\n')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function findChapterOneStart(text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (CHAPTER_PATTERN.test(trimmed)) {
      const before = lines.slice(0, i).join('\n');
      const wordsBefore = splitWords(before).length;
      return wordsBefore;
    }
  }
  return 0;
}

function extractChapters(text) {
  const lines = text.split('\n');
  const chapters = [];
  let currentChapter = { title: 'Start', startLine: 0 };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (CHAPTER_PATTERN.test(trimmed) || /^(part\s+\d+|epilogue|afterword)/i.test(trimmed)) {
      if (currentChapter) {
        currentChapter.endLine = i;
        chapters.push(currentChapter);
      }
      currentChapter = { title: trimmed, startLine: i };
    }
  }
  if (currentChapter) {
    currentChapter.endLine = lines.length;
    chapters.push(currentChapter);
  }

  let wordOffset = 0;
  return chapters.map(ch => {
    const chText = lines.slice(ch.startLine, ch.endLine).join('\n');
    const words = splitWords(chText);
    const chapter = { title: ch.title, wordStart: wordOffset, wordCount: words.length };
    wordOffset += words.length;
    return chapter;
  });
}

async function parseEpub(file) {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);
  await book.ready;

  const spine = book.spine;
  let fullText = '';

  for (const item of spine.items) {
    if (!item.href) continue;
    try {
      const doc = await book.load(item.href);
      const div = document.createElement('div');
      const serializer = new XMLSerializer();
      div.innerHTML = serializer.serializeToString(doc);
      const text = div.textContent || div.innerText || '';
      fullText += text + '\n\n';
    } catch {
      continue;
    }
  }

  return fullText;
}

async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
}

async function parseTxt(file) {
  return await file.text();
}

export async function parseBook(file) {
  const name = file.name.toLowerCase();
  let text;

  if (name.endsWith('.epub')) {
    text = await parseEpub(file);
  } else if (name.endsWith('.pdf')) {
    text = await parsePdf(file);
  } else {
    text = await parseTxt(file);
  }

  const words = splitWords(text);
  const chapterStart = findChapterOneStart(text);
  const chapters = extractChapters(text);

  return {
    title: file.name.replace(/\.(epub|txt|pdf)$/i, ''),
    words,
    chapterStart,
    chapters,
  };
}
