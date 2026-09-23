const API_URL = window.location.origin + '/api';
const BLOCK_SIZE = 20;
let currentWords = [];
let allWords = [];
let currentIndex = 0;
let currentTab = 'learning';
let currentDifficulty = 'easy';
let currentBlock = 0;
let totalBlocks = 1;

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupDifficultyButtons();
    setupEventListeners();
    loadStats();
    loadWords();
});

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            goToPage(item.dataset.page);
        });
    });
}

function setupDifficultyButtons() {
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentDifficulty = btn.dataset.difficulty;
            currentBlock = 0;
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadWords();
        });
    });
}

function goToPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) pageElement.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const menuItem = document.querySelector(`[data-page="${page}"]`);
    if (menuItem) menuItem.classList.add('active');

    if (page === 'cards') loadWords();
    if (page === 'progress') loadProgressStats();
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();

        document.getElementById('learned-count-dash').textContent = stats.learned;
        document.getElementById('remaining-count-dash').textContent = stats.remaining;
        document.getElementById('progress-dash').textContent = Math.round(stats.progress_percentage) + '%';
        document.getElementById('total-count-dash').textContent = stats.total_words;
        document.getElementById('progress-fill-dash').style.width = stats.progress_percentage + '%';
        document.getElementById('progress-text-dash').textContent = Math.round(stats.progress_percentage);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadWords() {
    try {
        const response = await fetch(`${API_URL}/words`);
        const words = await response.json();

        allWords = words.filter(word => word.difficulty === currentDifficulty);
        const filtered = allWords.filter(word => currentTab === 'learning' ? !word.learned : word.learned);

        if (filtered.length === 0) {
            currentWords = [];
            totalBlocks = 1;
            currentBlock = 0;
            displayCard();
            displayWordsList();
            renderBlockControls();
            return;
        }

        totalBlocks = Math.max(1, Math.ceil(filtered.length / BLOCK_SIZE));
        if (currentBlock >= totalBlocks) currentBlock = 0;

        const start = currentBlock * BLOCK_SIZE;
        const end = start + BLOCK_SIZE;
        currentWords = filtered.slice(start, end);

        displayCard();
        displayWordsList();
        renderBlockControls();
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

function renderBlockControls() {
    const controls = document.getElementById('block-controls');
    if (!controls) return;

    const visibleTotal = Math.max(1, totalBlocks);
    controls.innerHTML = `
        <button id="prev-block" class="block-btn">← Előző</button>
        <span>Blokk ${currentBlock + 1} / ${visibleTotal}</span>
        <button id="next-block" class="block-btn">Következő →</button>
    `;

    document.getElementById('prev-block').addEventListener('click', () => {
        if (currentBlock > 0) {
            currentBlock--;
            loadWords();
        }
    });

    document.getElementById('next-block').addEventListener('click', () => {
        if (currentBlock < totalBlocks - 1) {
            currentBlock++;
            loadWords();
        }
    });
}

function displayCard() {
    const card = document.getElementById('main-card');

    if (currentWords.length === 0) {
        card.innerHTML = `
            <div class="card-content">
                <div class="card-word">
                    <h2 class="spanish-word">🎉</h2>
                    <p class="english-word">Nincs több szó ebben a szinten.</p>
                </div>
            </div>
        `;
        document.getElementById('current-card-num').textContent = '0';
        document.getElementById('total-cards-num').textContent = '0';
        return;
    }

    const word = currentWords[currentIndex % currentWords.length];
    card.innerHTML = `
        <div class="card-content">
            <div class="card-word">
                <h2 class="spanish-word">${word.spanish}</h2>
                <p class="english-word">${word.english}</p>
            </div>
            <div class="card-example">
                <p class="label">Példa:</p>
                <p class="sentence">${word.example_sentence}</p>
                <p class="translation">${word.example_translation}</p>
            </div>
            <div class="card-progress">
                <span>Szó <span id="current-card-num">${currentIndex + 1}</span> / <span id="total-cards-num">${currentWords.length}</span></span>
            </div>
        </div>
    `;
}

function displayWordsList() {
    const listContainer = document.getElementById('words-list-container');
    if (currentWords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">Nincs megjeleníthető szó.</p>';
        return;
    }

    listContainer.innerHTML = currentWords.map(word => `
        <div class="word-item">
            <span class="word-rank">#${word.rank}</span>
            <div class="word-text">
                <div class="word-spanish">${word.spanish}</div>
                <div class="word-english">${word.english}</div>
            </div>
            <span class="word-status">${word.learned ? '✅' : '📚'}</span>
        </div>
    `).join('');
}

function setupEventListeners() {
    document.getElementById('btn-learn').addEventListener('click', markAsLearned);
    document.getElementById('btn-skip').addEventListener('click', markAsUnlearned);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            currentBlock = 0;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadWords();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') markAsUnlearned();
        if (e.key === 'ArrowRight') markAsLearned();
    });
}

async function markAsLearned() {
    if (currentWords.length === 0) return;
    const word = currentWords[currentIndex % currentWords.length];
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-learned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        currentIndex++;
        loadWords();
        loadStats();
    } catch (error) {
        console.error('Error marking as learned:', error);
    }
}

async function markAsUnlearned() {
    if (currentWords.length === 0) return;
    const word = currentWords[currentIndex % currentWords.length];
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-unlearned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        currentIndex++;
        loadWords();
        loadStats();
    } catch (error) {
        console.error('Error marking as unlearned:', error);
    }
}

async function loadProgressStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        document.getElementById('total-learned-stat').textContent = stats.learned;
        document.getElementById('total-remaining-stat').textContent = stats.remaining;
        document.getElementById('overall-progress').textContent = Math.round(stats.progress_percentage) + '%';

        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (stats.progress_percentage / 100) * circumference;
        const ringProgress = document.getElementById('progress-ring');
        if (ringProgress) ringProgress.style.strokeDashoffset = offset;

        loadLearnedWords();
    } catch (error) {
        console.error('Error loading progress stats:', error);
    }
}

async function loadLearnedWords() {
    try {
        const response = await fetch(`${API_URL}/words`);
        const words = await response.json();
        const learned = words.filter(word => word.learned);
        const container = document.getElementById('learned-words-list');
        if (learned.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">Még nincs megtanult szó.</p>';
            return;
        }

        container.innerHTML = learned.map(word => `
            <div class="learned-word-tag">
                <strong>${word.spanish}</strong><br>
                <small>${word.english}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading learned words:', error);
    }
}

function resetProgress() {
    if (confirm('Biztosan törölni szeretnéd a haladást?')) {
        localStorage.clear();
        location.reload();
    }
}

function exportProgress() {
    alert('A progress export funkció hamarosan érkezik!');
}
