const SUPABASE_URL = 'https://kugxesrsbelqtkexbjht.supabase.co';
const ANON_KEY = 'sb_publishable_K3Dy8_NRoKC3XIgLanfrWg_EVBfSZXM';

const emailEl      = document.getElementById('email');
const passEl       = document.getElementById('pass');
const statusEl     = document.getElementById('status');
const btnEl        = document.getElementById('btn');
const countEl      = document.getElementById('count');
const toggleEl     = document.getElementById('flashcardToggle');
const discEl       = document.getElementById('disc');
const matEl        = document.getElementById('mat');
const btnSaveDisc  = document.getElementById('btnSaveDisc');
const discStatusEl = document.getElementById('discStatus');

document.addEventListener('DOMContentLoaded', async () => {
  const d = await chrome.storage.local.get(['email', 'accessToken', 'todayDate', 'todayCount', 'saveFlashcard', 'disc', 'mat']);

  if (d.email) emailEl.value = d.email;

  if (d.accessToken) {
    statusEl.innerHTML = '<span class="ok">✓ Conectado</span>';
    btnEl.textContent = 'Reconectar';
  }

  const today = new Date().toISOString().slice(0, 10);
  countEl.textContent = d.todayDate === today ? (d.todayCount || 0) : 0;

  const saveFlashcard = d.saveFlashcard !== undefined ? d.saveFlashcard : true
  toggleEl.checked = saveFlashcard
  if (d.saveFlashcard === undefined) {
    chrome.storage.local.set({ saveFlashcard: true })
  }
  if (d.disc) discEl.value = d.disc;
  if (d.mat)  matEl.value  = d.mat;
});

btnSaveDisc.addEventListener('click', async () => {
  const disc = discEl.value.trim();
  const mat  = matEl.value.trim();
  if (!disc) { discStatusEl.innerHTML = '<span class="err">Informe a disciplina.</span>'; return; }
  await chrome.storage.local.set({ disc, mat });
  discStatusEl.innerHTML = '<span class="ok">✓ Salvo!</span>';
  setTimeout(() => discStatusEl.textContent = '', 2000);
});

toggleEl.addEventListener('change', () => {
  chrome.storage.local.set({ saveFlashcard: toggleEl.checked });
});

btnEl.addEventListener('click', async () => {
  const email = emailEl.value.trim();
  const pass  = passEl.value;

  if (!email || !pass) {
    statusEl.innerHTML = '<span class="err">Preencha os campos.</span>';
    return;
  }

  statusEl.textContent = 'Conectando…';
  btnEl.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();

    if (data.access_token) {
      await chrome.storage.local.set({
        email,
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        supabaseUrl:  SUPABASE_URL,
        anonKey:      ANON_KEY
      });
      statusEl.innerHTML = '<span class="ok">✓ Conectado com sucesso!</span>';
      btnEl.textContent = 'Reconectar';
    } else {
      statusEl.innerHTML = '<span class="err">E-mail ou senha incorretos.</span>';
    }
  } catch {
    statusEl.innerHTML = '<span class="err">Sem conexão com o Supabase.</span>';
  }

  btnEl.disabled = false;
});
