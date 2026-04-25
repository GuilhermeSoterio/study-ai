// StudyBI · QConcursos content script
// Detecta respostas e envia para o Supabase do StudyBI

const SESSION_KEY = 'studybi_logged';
const logged = new Set(JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'));

function persistLogged() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...logged]));
}

async function getConfig() {
  let d = await new Promise(resolve =>
    chrome.storage.local.get(['supabaseUrl', 'anonKey', 'accessToken', 'refreshToken', 'saveFlashcard', 'disc', 'mat'], resolve)
  );

  // Tenta renovar o token se estiver expirado
  if (d.accessToken && d.refreshToken && isTokenExpired(d.accessToken)) {
    try {
      const res = await fetch(`${d.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': d.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: d.refreshToken })
      });
      const json = await res.json();
      if (json.access_token) {
        await chrome.storage.local.set({ accessToken: json.access_token, refreshToken: json.refresh_token });
        d.accessToken = json.access_token;
        d.refreshToken = json.refresh_token;
      }
    } catch {}
  }

  return d;
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now() + 30000; // 30s de margem
  } catch { return true; }
}

function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

async function logQuestion(data) {
  const config = await getConfig();
  if (!config.accessToken || !config.supabaseUrl) {
    showToast('⚠️ StudyBI: faça login na extensão', '#f59e0b');
    return;
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const id = `qc_${data.questionId}_${Date.now()}`;

  const body = {
    id,
    user_id: getUserIdFromToken(config.accessToken),
    ts: Date.now(),
    date,
    disc: config.disc || data.disc,
    mat: config.mat || data.mat,
    total: 1,
    correct: data.correct ? 1 : 0,
    banca: data.banca,
    source: 'QConcursos'
  };
  if (data.errorType) body.error_type = data.errorType;

  const res = await fetch(`${config.supabaseUrl}/rest/v1/sessions`, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    // Só marca como registrada após sucesso
    logged.add(data.questionId);
    persistLogged();
    updateSessionStats(data.correct);

    chrome.storage.local.get(['todayDate', 'todayCount'], d => {
      const today = new Date().toISOString().slice(0, 10);
      const count = d.todayDate === today ? (d.todayCount || 0) + 1 : 1;
      chrome.storage.local.set({ todayDate: today, todayCount: count });
    });

    console.log('[StudyBI] saveFlashcard:', config.saveFlashcard, '| questionText:', JSON.stringify((data.questionText || '').slice(0, 80)), '| correctAnswer:', JSON.stringify(data.correctAnswer || ''));
    if (config.saveFlashcard && data.questionText) {
      await logFlashcard(data, config);
    } else {
      showToast(data.correct ? '✅ Acerto registrado!' : '❌ Erro registrado!');
    }
  } else {
    const errText = await res.text().catch(() => '');
    console.log('[StudyBI] Erro API:', res.status, errText);
    showToast('⚠️ Falha ao registrar. Reconecte na extensão.', '#ef4444');
  }
}

async function logFlashcard(data, config) {
  if (!data.questionText || data.questionText.length < 10) {
    showToast(data.correct ? '✅ Acerto registrado!' : '❌ Erro registrado!');
    return;
  }

  const id = `qc_fc_${data.questionId}_${Date.now()}`;
  const verso = data.correctAnswer || 'Ver gabarito no QConcursos';

  const res = await fetch(`${config.supabaseUrl}/rest/v1/flashcards`, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id,
      user_id: getUserIdFromToken(config.accessToken),
      ts: Date.now(),
      disc: config.disc || data.disc,
      mat: config.mat || data.mat,
      q: data.questionText,
      a: verso,
      banca: data.banca,
      reviews: []
    })
  });

  const icon = data.correct ? '✅' : '❌';
  showToast(res.ok ? `${icon} Registrado + 📇 Flashcard criado!` : `${icon} Registrado (flashcard falhou)`, res.ok ? '#7c3aed' : '#f59e0b');
}

// ── Encontra o bloco da questão subindo na árvore DOM ──
function findQuestionBlock(el) {
  let node = el;
  for (let i = 0; i < 15; i++) {
    if (!node || !node.parentElement) break;
    node = node.parentElement;
    const text = node.innerText || '';
    if (!text.match(/Q\d{5,}/) || !(text.includes('Banca:') || text.includes('Ano:'))) continue;
    // Retorna o menor container que tenha exatamente 1 Q-número (questão específica)
    const qCount = (text.match(/Q\d{5,}/g) || []).length;
    if (qCount === 1) return node;
  }
  return null;
}

// ── Extrai o enunciado da questão ──
function extractQuestionText(block) {
  const selectors = [
    '[class*="statement"]', '[class*="enunciado"]',
    '[class*="question-text"]', '[class*="question__text"]',
    '[class*="q-text"]', '[class*="q_text"]'
  ];
  for (const sel of selectors) {
    const el = block.querySelector(sel);
    if (el) {
      const t = el.innerText.trim();
      if (t.length > 20) return t;
    }
  }

  const fullText = block.innerText || '';

  // Encontra início das alternativas
  // Para antes do resultado (Responder, Você errou, Resolvi certo, etc.)
  const stopIdx = fullText.search(/\n[Rr]esponder\b|\n[Vv]ocê (errou|acertou)|\n[Rr]esolvi (certo|errado)|\n[Ff]icou com dúvidas/);
  const cleanText = stopIdx > 0 ? fullText.slice(0, stopIdx) : fullText;

  const altIdx = cleanText.search(/\n[Aa]lternativas\n/);
  const beforeAlts = altIdx > 0 ? cleanText.slice(0, altIdx) : cleanText;

  // Extrai enunciado (antes das alternativas)
  const metaPattern = /^Q\d{5,}|^Banca:|^Ano:|^Disciplina:|^Órgão:|^Prova:|^\d+$/;
  const lines = beforeAlts.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !metaPattern.test(l));

  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const isBreadcrumb = /:\s*\w/.test(l) && (l.match(/,/g)||[]).length >= 2 && l.length < 100;
    const isQuestion   = l.length > 60 || /[.!?"]/.test(l);
    if (!isBreadcrumb && isQuestion) { start = i; break; }
  }
  const enunciado = lines.slice(start).join('\n').trim();
  if (!enunciado) return '';

  // Extrai alternativas (entre "Alternativas" e "Responder"/"Você errou"/"Você acertou")
  const afterAlts = altIdx > 0 ? fullText.slice(altIdx) : '';
  const stopMatch = afterAlts.search(/\n[Rr]esponder\b|\n[Vv]ocê (errou|acertou)|\n[Ff]icou com dúvidas/);
  const altsBlock = stopMatch > 0 ? afterAlts.slice(0, stopMatch) : afterAlts;

  // Formata alternativas: converte "\nA\ntexto\n" → "A) texto"
  const altsText = altsBlock
    .replace(/\n([A-E])\n([^\n]+)/g, '\n\n$1) $2')
    .replace(/\n[Aa]lternativas\n?/, '')
    .trim();

  return altsText ? `${enunciado}\n\n${altsText}` : enunciado;
}

// ── Extrai a alternativa correta ──
function extractCorrectAnswer(block, selectedLetter) {
  const text = block.innerText || '';

  // Se o usuário acertou e sabemos qual letra ele selecionou
  if (selectedLetter && /^[A-E]$/.test(selectedLetter)) {
    const optNewline = text.match(new RegExp(`\\n${selectedLetter}\\n([^\\n]{5,})`));
    if (optNewline) return `${selectedLetter}) ${optNewline[1].trim()}`;
    const optParen = text.match(new RegExp(`${selectedLetter}\\)\\s*([^\\n]{5,})`));
    if (optParen) return `${selectedLetter}) ${optParen[1].trim()}`;
  }

  // "Você errou! Resposta: B" ou "Resposta: B"
  const respostaMatch = text.match(/[Rr]esposta:\s*([A-E])\b/);
  if (respostaMatch) {
    const letter = respostaMatch[1];
    // Formato "A\n[texto]" (QConcursos)
    const optNewline = text.match(new RegExp(`\\n${letter}\\n([^\\n]{5,})`));
    if (optNewline) return `${letter}) ${optNewline[1].trim()}`;
    // Formato "A) texto"
    const optParen = text.match(new RegExp(`${letter}\\)\\s*([^\\n]{5,})`));
    return optParen ? `${letter}) ${optParen[1].trim()}` : `Gabarito: ${letter}`;
  }

  // "Gabarito: X"
  const gabMatch = text.match(/[Gg]abarito[^:]*:\s*([A-E])\b/);
  if (gabMatch) {
    const letter = gabMatch[1];
    const optNewline = text.match(new RegExp(`\\n${letter}\\n([^\\n]{5,})`));
    if (optNewline) return `${letter}) ${optNewline[1].trim()}`;
    const optParen = text.match(new RegExp(`${letter}\\)\\s*([^\\n]{5,})`));
    return optParen ? `${letter}) ${optParen[1].trim()}` : `Gabarito: ${letter}`;
  }

  // Elemento com classe de correto
  const correctSelectors = [
    '[class*="correct"]:not([class*="incorrect"])',
    '[class*="gabarito"]', '[class*="right-answer"]',
    '[class*="answer--correct"]', '[class*="acerto"]'
  ];
  for (const sel of correctSelectors) {
    const el = block.querySelector(sel);
    if (el) {
      const t = el.innerText.trim();
      if (t.length > 1 && t.length < 400) return t;
    }
  }

  return '';
}

// ── Parseia todos os dados do bloco ──
function parseQuestionBlock(block, selectedLetter) {
  const text = block.innerText || '';

  const qMatch = text.match(/Q(\d{5,})/);
  if (!qMatch) return null;
  const questionId = qMatch[0];

  let disc = 'Não informada';
  let mat = 'Não informada';

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith(questionId) || line.includes(questionId + ' ') || line.includes(questionId + '\t')) {
      const breadcrumb = line.replace(questionId, '').trim();
      const parts = breadcrumb.split(/\s*[>›»]\s*/).map(p => p.trim()).filter(Boolean);
      if (parts[0]) disc = parts[0];
      if (parts[1]) mat = parts[1];
      break;
    }
  }

  if (disc === 'Não informada') {
    const allEls = block.querySelectorAll('*');
    for (const el of allEls) {
      if (el.children.length <= 3) {
        const t = el.innerText || el.textContent || '';
        if (t.includes(questionId)) {
          const breadcrumb = t.replace(questionId, '').trim();
          const parts = breadcrumb.split(/\s*[>›»]\s*/).map(p => p.trim()).filter(Boolean);
          if (parts[0] && !parts[0].match(/^\d+$/)) {
            disc = parts[0];
            if (parts[1]) mat = parts[1];
            break;
          }
        }
      }
    }
  }

  let banca = 'Não informada';
  const bancaMatch = text.match(/Banca:\s*([^\s\n]+)/);
  if (bancaMatch) banca = bancaMatch[1].trim();

  const questionText = extractQuestionText(block);
  const correctAnswer = extractCorrectAnswer(block, selectedLetter);

  return { questionId, disc, mat, banca, questionText, correctAnswer };
}

// ── Modal "Por que você errou?" ────────────────────────────────────────────────
const ERROR_TYPES = [
  { value: 'nao_sabia',  label: 'Não sabia',  desc: 'Conteúdo desconhecido',   color: '#ef4444' },
  { value: 'distracao',  label: 'Distração',   desc: 'Li errado ou me enganei', color: '#f59e0b' },
  { value: 'pegadinha',  label: 'Pegadinha',   desc: 'A banca induziu ao erro', color: '#a78bfa' },
  { value: 'tempo',      label: 'Tempo',       desc: 'Não tive tempo suficiente',color: '#7878a0' },
];

function showErrorModal(onSelect) {
  const existing = document.getElementById('sbi-error-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'sbi-error-modal';

  modal.innerHTML = `
    <style>
      #sbi-error-modal { all: initial; }
      #sbi-error-modal * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }
      @keyframes sbi-modal-in {
        0%  { opacity:0; transform:translate(-50%,-50%) scale(.92); }
        100%{ opacity:1; transform:translate(-50%,-50%) scale(1); }
      }
      #sbi-modal-box {
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        z-index:2147483647;
        background:#0f0f1d; border:1px solid #28283f; border-radius:14px;
        padding:20px 22px; width:300px;
        box-shadow:0 8px 40px rgba(0,0,0,.85);
        animation:sbi-modal-in .22s ease;
      }
      #sbi-modal-backdrop {
        position:fixed; inset:0; z-index:2147483646;
        background:rgba(0,0,0,.55);
      }
      .sbi-m-title { font-size:13px; font-weight:800; color:#eeeeff; margin-bottom:4px; }
      .sbi-m-sub   { font-size:11px; color:#7878a0; margin-bottom:14px; }
      .sbi-m-grid  { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
      .sbi-m-btn {
        background:#17172a; border:1px solid #28283f; border-radius:8px;
        padding:10px 8px; cursor:pointer; text-align:left; transition:border-color .15s, background .15s;
      }
      .sbi-m-btn:hover { background:#1e1e33; }
      .sbi-m-btn-label { font-size:12px; font-weight:700; color:#eeeeff; display:block; }
      .sbi-m-btn-desc  { font-size:10px; color:#7878a0; display:block; margin-top:2px; }
      .sbi-m-skip {
        width:100%; padding:7px; background:none; border:1px solid #28283f;
        border-radius:7px; color:#7878a0; font-size:11px; font-family:inherit;
        cursor:pointer; transition:border-color .15s, color .15s;
      }
      .sbi-m-skip:hover { border-color:#7878a0; color:#c4c4e0; }
    </style>
    <div id="sbi-modal-backdrop"></div>
    <div id="sbi-modal-box">
      <div class="sbi-m-title">❌ Por que você errou?</div>
      <div class="sbi-m-sub">Isso ajuda a entender seus padrões de erro</div>
      <div class="sbi-m-grid">
        ${ERROR_TYPES.map(e => `
          <button class="sbi-m-btn" data-value="${e.value}" style="border-color:${e.color}22;">
            <span class="sbi-m-btn-label" style="color:${e.color}">${e.label}</span>
            <span class="sbi-m-btn-desc">${e.desc}</span>
          </button>
        `).join('')}
      </div>
      <button class="sbi-m-skip" id="sbi-m-skip-btn">Pular — não classificar</button>
    </div>
  `;

  document.body.appendChild(modal);

  function close(value) {
    modal.remove();
    onSelect(value);
  }

  modal.querySelectorAll('.sbi-m-btn').forEach(btn => {
    btn.addEventListener('click', () => close(btn.dataset.value));
  });
  modal.querySelector('#sbi-m-skip-btn').addEventListener('click', () => close(null));
  modal.querySelector('#sbi-modal-backdrop').addEventListener('click', () => close(null));
}

// ── Processa resultado a partir de um bloco já identificado ──
function processBlock(block, isCorrect, selectedLetter) {
  const data = parseQuestionBlock(block, selectedLetter);
  if (!data) { console.log('[StudyBI] parseQuestionBlock retornou null'); return; }
  if (logged.has(data.questionId)) { showToast('📌 Questão já registrada no StudyBI!', '#7878a0'); return; }

  if (!isCorrect) {
    showErrorModal(errorType => {
      logQuestion({ ...data, correct: false, errorType: errorType || null });
    });
  } else {
    logQuestion({ ...data, correct: true });
  }
}

// ── Rastreia a alternativa selecionada ──
let selectedOption = '';
document.addEventListener('click', (e) => {
  const el = e.target;
  // Captura clique em alternativa (input radio ou label com letra A-E)
  if (el.tagName === 'INPUT' && el.type === 'radio') {
    selectedOption = (el.value || '').trim().toUpperCase();
  } else {
    const t = (el.innerText || el.textContent || '').trim();
    if (/^[A-E]$/.test(t)) selectedOption = t;
  }
}, true);

// ── Estratégia 1: clique no botão "Responder" ──
document.addEventListener('click', (e) => {
  const el = e.target;
  const text = (el.innerText || el.textContent || el.value || '').trim();

  if (!/responder/i.test(text) || text.length > 60) return;

  // Tenta encontrar o bloco desta questão a partir do botão
  const block = findQuestionBlock(el);
  const optionAtClick = selectedOption; // salva opção selecionada no momento

  setTimeout(() => {
    if (block) {
      const blockText = block.innerText || '';
      const isCorrect = /acertou|você acertou|resolvi certo/i.test(blockText);
      const isWrong   = /errou|você errou|resposta:\s*[A-E]|resolvi errado/i.test(blockText);
      if (isCorrect || isWrong) { processBlock(block, isCorrect, optionAtClick); return; }
    }

    // Fallback: varre a página mas só processa questões ainda não registradas
    const all = document.querySelectorAll('*');
    for (const node of all) {
      const t = (node.innerText || node.textContent || '').trim();
      if (t.length > 150 || t.length < 5) continue;
      if (!/acertou|errou|resolvi/i.test(t)) continue;
      const isCorrect = /acertou|você acertou|resolvi certo/i.test(t);
      const isWrong   = /errou|você errou|resolvi errado|resposta:\s*[A-E]/i.test(t);
      if (!isCorrect && !isWrong) continue;
      const b = findQuestionBlock(node);
      if (!b) continue;
      const data = parseQuestionBlock(b);
      if (!data || logged.has(data.questionId)) continue;
      processBlock(b, isCorrect, optionAtClick);
      break;
    }
  }, 1000);
}, true);

// ── Estratégia 2: MutationObserver como fallback ──
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      const text = node.innerText || node.textContent || '';
      if (!/acertou|errou|você errou|você acertou/i.test(text)) continue;

      // Tenta encontrar o bloco subindo a partir do nó adicionado
      const block = findQuestionBlock(node);
      if (block) {
        const isCorrect = /acertou|você acertou/i.test(text);
        processBlock(block, isCorrect);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// ── Estatísticas da sessão ────────────────────────────────────────────────────
const sessionStats = { total: 0, correct: 0, streak: 0, bestStreak: 0 };

function updateSessionStats(isCorrect) {
  sessionStats.total++;
  if (isCorrect) {
    sessionStats.correct++;
    sessionStats.streak++;
    if (sessionStats.streak > sessionStats.bestStreak) sessionStats.bestStreak = sessionStats.streak;
  } else {
    sessionStats.streak = 0;
  }
  renderWidget();
  animateWidget(isCorrect);
}

// ── Widget principal ──────────────────────────────────────────────────────────
function getOrCreateWidget() {
  let w = document.getElementById('sbi-widget');
  if (!w) {
    w = document.createElement('div');
    w.id = 'sbi-widget';
    document.body.appendChild(w);
  }
  return w;
}

function renderWidget() {
  const w = getOrCreateWidget();
  const acc = sessionStats.total > 0
    ? Math.round((sessionStats.correct / sessionStats.total) * 100)
    : 0;
  const accColor = acc >= 75 ? '#10b981' : acc >= 50 ? '#f59e0b' : '#ef4444';
  const streakFire = sessionStats.streak >= 3
    ? `🔥`.repeat(Math.min(sessionStats.streak, 5))
    : sessionStats.streak > 0 ? '⚡' : '—';

  w.innerHTML = `
    <style>
      #sbi-widget { all: initial; }
      #sbi-widget * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }
      @keyframes sbi-pop { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
      @keyframes sbi-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 60%{transform:translateX(6px)} }
      @keyframes sbi-glow-green { 0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.7)} 50%{box-shadow:0 0 32px rgba(16,185,129,.55)} }
      @keyframes sbi-glow-red   { 0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.7)} 50%{box-shadow:0 0 32px rgba(239,68,68,.45)} }
      @keyframes sbi-counter    { 0%{transform:translateY(-8px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      #sbi-box {
        position:fixed; bottom:24px; right:24px; z-index:2147483646;
        background:#0f0f1d; border:1px solid #28283f; border-radius:14px;
        padding:14px 16px; width:220px;
        box-shadow:0 4px 24px rgba(0,0,0,.7);
        transition: box-shadow .4s;
      }
      #sbi-box.correct { animation: sbi-glow-green .6s ease; }
      #sbi-box.wrong   { animation: sbi-glow-red   .6s ease; }
      .sbi-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
      .sbi-logo { font-size:11px; font-weight:800; color:#a78bfa; letter-spacing:.06em; }
      .sbi-cfg { font-size:14px; cursor:pointer; opacity:.6; transition:opacity .2s; background:none; border:none; padding:0; }
      .sbi-cfg:hover { opacity:1; }
      .sbi-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:10px; }
      .sbi-stat { background:#17172a; border-radius:8px; padding:6px 4px; text-align:center; }
      .sbi-val { font-size:20px; font-weight:900; color:#eeeeff; line-height:1; animation: sbi-counter .25s ease; }
      .sbi-val.pop { animation: sbi-pop .35s ease; }
      .sbi-lbl { font-size:9px; color:#7878a0; text-transform:uppercase; letter-spacing:.05em; margin-top:2px; }
      .sbi-streak { font-size:16px; font-weight:900; line-height:1; animation: sbi-counter .25s ease; }
      .sbi-divider { border:none; border-top:1px solid #1e1e33; margin:0 0 10px; }
      .sbi-cat { font-size:10px; color:#7878a0; margin-bottom:2px; }
      .sbi-cat-val { font-size:11px; color:#c4c4e0; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .sbi-edit { margin-top:8px; }
      .sbi-edit input {
        width:100%; background:#0f0f1d; border:1px solid #28283f; color:#eeeeff;
        padding:5px 8px; border-radius:5px; font-size:11px; margin-bottom:5px; outline:none;
        font-family:inherit;
      }
      .sbi-edit input:focus { border-color:#7c3aed; }
      .sbi-save-btn {
        width:100%; padding:5px; background:linear-gradient(135deg,#7c3aed,#0891b2);
        border:none; border-radius:5px; color:#fff; font-size:11px; font-weight:700;
        cursor:pointer; font-family:inherit;
      }
      .sbi-progress { height:3px; border-radius:2px; background:#1e1e33; margin-top:10px; overflow:hidden; }
      .sbi-progress-fill { height:100%; border-radius:2px; transition:width .5s ease, background .4s; }
    </style>

    <div id="sbi-box">
      <div class="sbi-header">
        <span class="sbi-logo">📊 StudyBI</span>
        <button class="sbi-cfg" id="sbi-toggle-cfg" title="Configurar disciplina">⚙️</button>
      </div>

      <div class="sbi-stats">
        <div class="sbi-stat">
          <div class="sbi-val" id="sbi-total">${sessionStats.total}</div>
          <div class="sbi-lbl">Questões</div>
        </div>
        <div class="sbi-stat">
          <div class="sbi-val" id="sbi-acc" style="color:${accColor}">${acc}%</div>
          <div class="sbi-lbl">Acerto</div>
        </div>
        <div class="sbi-stat">
          <div class="sbi-streak" id="sbi-streak">${streakFire}</div>
          <div class="sbi-lbl">Sequência</div>
        </div>
      </div>

      <div class="sbi-progress">
        <div class="sbi-progress-fill" style="width:${acc}%; background:${accColor}"></div>
      </div>

      <div id="sbi-cfg-section" style="display:none; margin-top:10px;">
        <hr class="sbi-divider" style="margin-top:10px;">
        <div class="sbi-edit">
          <div class="sbi-cat">Disciplina</div>
          <input id="sbi-disc" value="" placeholder="ex: Fonética">
          <div class="sbi-cat">Matéria</div>
          <input id="sbi-mat" value="" placeholder="ex: Ortografia">
          <button class="sbi-save-btn" id="sbi-save">Salvar</button>
        </div>
      </div>

      <div id="sbi-cat-display" style="margin-top:8px;">
        <div class="sbi-cat">Registrando em</div>
        <div class="sbi-cat-val" id="sbi-cat-label">—</div>
      </div>
    </div>
  `;

  // Carrega disc/mat atual
  chrome.storage.local.get(['disc','mat'], d => {
    const discInput = w.querySelector('#sbi-disc');
    const matInput  = w.querySelector('#sbi-mat');
    const catLabel  = w.querySelector('#sbi-cat-label');
    if (discInput) discInput.value = d.disc || '';
    if (matInput)  matInput.value  = d.mat  || '';
    if (catLabel)  catLabel.textContent = (d.disc && d.mat) ? `${d.disc} › ${d.mat}` : '⚠️ Defina abaixo';
  });

  // Toggle config
  w.querySelector('#sbi-toggle-cfg').addEventListener('click', () => {
    const sec = w.querySelector('#sbi-cfg-section');
    sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
  });

  // Salvar disc/mat
  w.querySelector('#sbi-save').addEventListener('click', () => {
    const d = w.querySelector('#sbi-disc').value.trim();
    const m = w.querySelector('#sbi-mat').value.trim();
    chrome.storage.local.set({ disc: d, mat: m });
    w.querySelector('#sbi-cfg-section').style.display = 'none';
    w.querySelector('#sbi-cat-label').textContent = (d && m) ? `${d} › ${m}` : '⚠️ Defina acima';
    showToast('✓ Disciplina salva!', '#7c3aed');
  });
}

function animateWidget(isCorrect) {
  const box = document.getElementById('sbi-box');
  if (!box) return;
  box.classList.remove('correct', 'wrong');
  void box.offsetWidth; // reflow
  box.classList.add(isCorrect ? 'correct' : 'wrong');

  // Anima o número de questões
  const totalEl = document.getElementById('sbi-total');
  if (totalEl) { totalEl.classList.remove('pop'); void totalEl.offsetWidth; totalEl.classList.add('pop'); }
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderWidget();

// Detecta paginação (mudança de URL sem reload)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(renderWidget, 800);
  }
}).observe(document.body, { childList: true, subtree: true });

// ── Toast ──────────────────────────────────────────────────────────────────────
function showToast(msg, color) {
  const existing = document.getElementById('studybi-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'studybi-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    z-index:2147483647; background:#0f0f1d; color:#eeeeff; padding:10px 20px;
    border-radius:20px; font-size:13px; font-family:Inter,sans-serif;
    border:1px solid ${color || '#7c3aed'};
    box-shadow:0 4px 24px rgba(0,0,0,.6);
    opacity:0; transition:opacity .25s, transform .25s;
    transform:translateX(-50%) translateY(8px);
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
