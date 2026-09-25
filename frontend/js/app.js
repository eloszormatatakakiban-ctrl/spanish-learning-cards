const API_URL = window.location.origin + '/api';
const BLOCK_SIZE = 20;
const USERS_KEY = 'spanishlearn_users';
const SESSION_KEY = 'spanishlearn_session';

let currentWords = [];
let currentIndex = 0;
let currentTab = 'learning';
let currentDifficulty = 'easy';
let currentBlock = 0;
let totalBlocks = 1;
let isCardFlipped = false;

function getSession() {
    return localStorage.getItem(SESSION_KEY);
}

function stateKey() {
    return `spanishlearn_state_${getSession()}`;
}

function saveState() {
    if (!getSession()) return;
    localStorage.setItem(stateKey(), JSON.stringify({
        difficulty: currentDifficulty,
        block: currentBlock,
        index: currentIndex,
        tab: currentTab
    }));
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(stateKey()) || '{}');
        currentDifficulty = saved.difficulty || 'easy';
        currentBlock = Number.isInteger(saved.block) ? saved.block : 0;
        currentIndex = Number.isInteger(saved.index) ? saved.index : 0;
        currentTab = saved.tab || 'learning';
    } catch (_) {
        currentDifficulty = 'easy';
        currentBlock = 0;
        currentIndex = 0;
        currentTab = 'learning';
    }
}

async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function showLogin() {
    document.body.innerHTML = `
        <main class="auth-page">
            <form id="auth-form" class="auth-box">
                <h1>🇪🇸 SpanishLearn</h1>
                <h2>Bejelentkezés</h2>
                <p class="auth-help">A haladásod elmentéséhez hozz létre felhasználót.</p>
                <label>Felhasználónév<input id="auth-username" required autocomplete="username"></label>
                <label>Jelszó<input id="auth-password" type="password" minlength="4" required autocomplete="new-password"></label>
                <button type="submit" class="auth-button">Belépés / Regisztráció</button>
                <p id="auth-message" class="auth-message"></p>
            </form>
        </main>
        <style>
            .auth-page{min-height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#667eea,#764ba2);font-family:Arial,sans-serif}
            .auth-box{width:min(92%,400px);padding:32px;background:white;border-radius:16px;box-shadow:0 10px 35px #0004;display:flex;flex-direction:column;gap:14px}
            .auth-box h1,.auth-box h2{text-align:center;margin:0}.auth-help{color:#6c757d;text-align:center;font-size:14px}
            .auth-box label{display:flex;flex-direction:column;gap:6px;font-weight:600}.auth-box input{padding:12px;border:1px solid #ddd;border-radius:8px;font-size:16px}
            .auth-button{padding:13px;border:0;border-radius:8px;background:#667eea;color:white;font-size:16px;font-weight:bold;cursor:pointer}.auth-message{text-align:center;color:#d6336c;min-height:20px}
        </style>`;

    document.getElementById('auth-form').addEventListener('submit', async event => {
        event.preventDefault();
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const message = document.getElementById('auth-message');
        if (!username || password.length < 4) {
            message.textContent = 'Adj meg felhasználónevet és legalább 4 karakteres jelszót.';
            return;
        }
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
        const passwordHash = await hashPassword(password);
        if (users[username] && users[username] !== passwordHash) {
            message.textContent = 'Hibás jelszó ehhez a felhasználónévhez.';
            return;
        }
        users[username] = passwordHash;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(SESSION_KEY, username);
        location.reload();
    });
}

function addLogoutButton() {
    const header = document.querySelector('.header-right');
    if (!header) return;
    const button = document.createElement('button');
    button.className = 'logout-button';
    button.textContent = `Kilépés (${getSession()})`;
    button.onclick = () => { saveState(); localStorage.removeItem(SESSION_KEY); location.reload(); };
    header.appendChild(button);
}

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', event => {
        event.preventDefault(); goToPage(item.dataset.page);
    }));
}

function setupDifficultyButtons() {
    document.querySelectorAll('.difficulty-btn').forEach(button => button.addEventListener('click', () => {
        currentDifficulty = button.dataset.difficulty; currentBlock = 0; currentIndex = 0; isCardFlipped = false;
        document.querySelectorAll('.difficulty-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active'); saveState(); loadWords();
    }));
}

function goToPage(page) {
    document.querySelectorAll('.page').forEach(item => item.classList.remove('active'));
    document.getElementById(`${page}-page`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === page));
    if (page === 'cards') loadWords();
    if (page === 'progress') loadProgressStats();
}

async function loadStats() {
    const response = await fetch(`${API_URL}/stats`); const stats = await response.json();
    document.getElementById('learned-count-dash').textContent = stats.learned;
    document.getElementById('remaining-count-dash').textContent = stats.remaining;
    document.getElementById('progress-dash').textContent = `${Math.round(stats.progress_percentage)}%`;
    document.getElementById('total-count-dash').textContent = stats.total_words;
    document.getElementById('progress-fill-dash').style.width = `${stats.progress_percentage}%`;
    document.getElementById('progress-text-dash').textContent = Math.round(stats.progress_percentage);
}

async function loadWords() {
    try {
        const response = await fetch(`${API_URL}/words`); const words = await response.json();
        let filtered = words.filter(word => word.difficulty === currentDifficulty);
        filtered = filtered.filter(word => currentTab === 'learning' ? !word.learned : word.learned);
        totalBlocks = Math.max(1, Math.ceil(filtered.length / BLOCK_SIZE));
        if (currentBlock >= totalBlocks) currentBlock = 0;
        currentWords = filtered.slice(currentBlock * BLOCK_SIZE, currentBlock * BLOCK_SIZE + BLOCK_SIZE);
        if (currentIndex >= currentWords.length) currentIndex = 0;
        displayCard(); displayWordsList(); renderBlockControls(); saveState();
    } catch (error) { console.error('Error loading words:', error); }
}

function renderBlockControls() {
    const controls = document.getElementById('block-controls'); if (!controls) return;
    controls.innerHTML = `<button id="prev-block" class="block-btn">← Előző</button><span>Blokk ${currentBlock + 1} / ${totalBlocks}</span><button id="next-block" class="block-btn">Következő →</button>`;
    document.getElementById('prev-block').onclick = () => { if (currentBlock > 0) { currentBlock--; currentIndex = 0; isCardFlipped = false; loadWords(); } };
    document.getElementById('next-block').onclick = () => { if (currentBlock < totalBlocks - 1) { currentBlock++; currentIndex = 0; isCardFlipped = false; loadWords(); } };
}

function displayCard() {
    const container = document.getElementById('main-card');
    if (!currentWords.length) { container.innerHTML = '<div class="card-content"><h2>🎉</h2><p>Nincs több szó ebben a szinten.</p></div>'; return; }
    const word = currentWords[currentIndex];
    container.innerHTML = `<div class="flip-card ${isCardFlipped ? 'is-flipped' : ''}" role="button" tabindex="0" aria-label="Kattints a kártya megfordításához"><div class="flip-card-inner"><div class="flip-card-front"><div class="card-content"><p class="card-side-label">SPANYOL</p><h2 class="spanish-word">${word.spanish}</h2><p class="flip-hint">Kattints a magyar jelentéshez</p><div class="card-progress">Szó ${currentIndex + 1} / ${currentWords.length}</div></div></div><div class="flip-card-back"><div class="card-content"><p class="card-side-label">MAGYAR</p><h2 class="spanish-word">${word.english}</h2><p class="translation">${word.example_translation || ''}</p><p class="flip-hint">Kattints a spanyol szóhoz</p></div></div></div></div>`;
    const flip = container.querySelector('.flip-card');
    const toggle = () => { isCardFlipped = !isCardFlipped; displayCard(); };
    flip.onclick = toggle; flip.onkeydown = event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggle(); } };
}

function displayWordsList() {
    const container = document.getElementById('words-list-container');
    container.innerHTML = currentWords.length ? currentWords.map(word => `<div class="word-item"><span class="word-rank">#${word.rank}</span><div class="word-text"><div class="word-spanish">${word.spanish}</div><div class="word-english">${word.english}</div></div><span>${word.learned ? '✅' : '📚'}</span></div>`).join('') : '<p>Nincs megjeleníthető szó.</p>';
}

function setupEventListeners() {
    document.getElementById('btn-learn').onclick = markAsLearned;
    document.getElementById('btn-skip').onclick = markAsUnlearned;
    document.querySelectorAll('.tab-btn').forEach(button => button.onclick = () => {
        currentTab = button.dataset.tab; currentBlock = 0; currentIndex = 0; isCardFlipped = false;
        document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active')); button.classList.add('active'); loadWords();
    });
    document.addEventListener('keydown', event => {
        if (event.target.matches('input,textarea')) return;
        if (event.key === 'ArrowLeft') markAsUnlearned();
        if (event.key === 'ArrowRight') markAsLearned();
    });
}

async function advance(endpoint) {
    if (!currentWords.length) return;
    const word = currentWords[currentIndex];
    await fetch(`${API_URL}/words/${word.id}/${endpoint}`, { method: 'POST' });
    currentIndex = (currentIndex + 1) % currentWords.length; isCardFlipped = false; saveState();
    await loadWords(); await loadStats();
}
function markAsLearned() { return advance('mark-learned'); }
function markAsUnlearned() { return advance('mark-unlearned'); }

async function loadProgressStats() {
    const response = await fetch(`${API_URL}/stats`); const stats = await response.json();
    document.getElementById('total-learned-stat').textContent = stats.learned;
    document.getElementById('total-remaining-stat').textContent = stats.remaining;
    document.getElementById('overall-progress').textContent = `${Math.round(stats.progress_percentage)}%`;
    const ring = document.getElementById('progress-ring');
    if (ring) ring.style.strokeDashoffset = 565 - (stats.progress_percentage / 100) * 565;
    loadLearnedWords();
}

async function loadLearnedWords() {
    const response = await fetch(`${API_URL}/words`); const words = (await response.json()).filter(word => word.learned);
    document.getElementById('learned-words-list').innerHTML = words.length ? words.map(word => `<div class="learned-word-tag"><strong>${word.spanish}</strong><br><small>${word.english}</small></div>`).join('') : '<p>Még nincs megtanult szó.</p>';
}

function resetProgress() { if (confirm('Biztosan törölni szeretnéd a haladást?')) { localStorage.removeItem(stateKey()); location.reload(); } }
function exportProgress() { alert('Az exportálás hamarosan érkezik!'); }

function startApp() {
    loadState();
    setupNavigation(); setupDifficultyButtons(); setupEventListeners(); addLogoutButton();
    document.querySelectorAll('.difficulty-btn').forEach(button => button.classList.toggle('active', button.dataset.difficulty === currentDifficulty));
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.toggle('active', button.dataset.tab === currentTab));
    loadStats(); loadWords();
}

document.addEventListener('DOMContentLoaded', () => {
    if (getSession()) startApp(); else showLogin();
});
