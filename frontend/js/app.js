// Configuration
const API_URL = window.location.origin + '/api';
let currentWords = [];
let currentIndex = 0;
let currentTab = 'learning';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadStats();
    loadWords();
    setupEventListeners();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            goToPage(page);
        });
    });
}

function goToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Show selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Load page-specific data
    if (page === 'cards') {
        loadWords();
    } else if (page === 'progress') {
        loadProgressStats();
    }
}

// Load statistics for dashboard
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

// Load words for card learning
async function loadWords() {
    try {
        const endpoint = currentTab === 'learning' 
            ? `${API_URL}/words/learning` 
            : `${API_URL}/words/learned`;
        
        const response = await fetch(endpoint);
        currentWords = await response.json();
        currentIndex = 0;
        displayCard();
        displayWordsList();
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

// Display current card
function displayCard() {
    const card = document.getElementById('main-card');
    
    if (currentWords.length === 0) {
        card.innerHTML = `
            <div class="card-content">
                <div class="card-word">
                    <h2 class="spanish-word">🎉</h2>
                    <p class="english-word">No more words in this category!</p>
                </div>
            </div>
        `;
        document.getElementById('current-card-num').textContent = '0';
        document.getElementById('total-cards-num').textContent = '0';
        return;
    }

    const word = currentWords[currentIndex];
    card.innerHTML = `
        <div class="card-content">
            <div class="card-word">
                <h2 class="spanish-word">${word.spanish}</h2>
                <p class="english-word">${word.english}</p>
            </div>
            <div class="card-example">
                <p class="label">Ejemplo:</p>
                <p class="sentence">${word.example_sentence}</p>
                <p class="translation">${word.example_translation}</p>
            </div>
            <div class="card-progress">
                <span>Card <span id="current-card-num">${currentIndex + 1}</span> of <span id="total-cards-num">${currentWords.length}</span></span>
            </div>
        </div>
    `;
}

// Display words list
function displayWordsList() {
    const listContainer = document.getElementById('words-list-container');
    
    if (currentWords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">No words to display</p>';
        return;
    }
    
    listContainer.innerHTML = currentWords.map((word, idx) => `
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

// Setup event listeners
function setupEventListeners() {
    document.getElementById('btn-learn').addEventListener('click', markAsLearned);
    document.getElementById('btn-skip').addEventListener('click', markAsUnlearned);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadWords();
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') markAsUnlearned();
        if (e.key === 'ArrowRight') markAsLearned();
    });
}

// Mark as learned
async function markAsLearned() {
    if (currentWords.length === 0) return;
    
    const word = currentWords[currentIndex];
    
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-learned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        currentIndex++;
        if (currentIndex >= currentWords.length) {
            currentIndex = 0;
        }
        displayCard();
        displayWordsList();
        loadStats();
    } catch (error) {
        console.error('Error marking as learned:', error);
    }
}

// Mark as unlearned
async function markAsUnlearned() {
    if (currentWords.length === 0) return;
    
    const word = currentWords[currentIndex];
    
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-unlearned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        currentIndex++;
        if (currentIndex >= currentWords.length) {
            currentIndex = 0;
        }
        displayCard();
        displayWordsList();
        loadStats();
    } catch (error) {
        console.error('Error marking as unlearned:', error);
    }
}

// Load progress statistics
async function loadProgressStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        document.getElementById('total-learned-stat').textContent = stats.learned;
        document.getElementById('total-remaining-stat').textContent = stats.remaining;
        document.getElementById('overall-progress').textContent = Math.round(stats.progress_percentage) + '%';
        
        // Update progress ring
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (stats.progress_percentage / 100) * circumference;
        const ringProgress = document.getElementById('progress-ring');
        if (ringProgress) {
            ringProgress.style.strokeDashoffset = offset;
        }
        
        loadLearnedWords();
    } catch (error) {
        console.error('Error loading progress stats:', error);
    }
}

// Load learned words
async function loadLearnedWords() {
    try {
        const response = await fetch(`${API_URL}/words/learned`);
        const words = await response.json();
        
        const container = document.getElementById('learned-words-list');
        if (words.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999;">No learned words yet. Start learning!</p>';
            return;
        }
        
        container.innerHTML = words.map(word => `
            <div class="learned-word-tag">
                <strong>${word.spanish}</strong>
                <br>
                <small>${word.english}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading learned words:', error);
    }
}

// Reset progress
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
    }
}

// Export progress
function exportProgress() {
    alert('Export feature coming soon!');
}
