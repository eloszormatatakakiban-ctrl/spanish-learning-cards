// Configuration - Works on any domain
const API_URL = window.location.origin + '/api';
let currentWords = [];
let currentIndex = 0;
let currentTab = 'learning';
let touchStartX = 0;
let touchEndX = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadWords();
    setupEventListeners();
    updateStats();
});

// Setup Event Listeners
function setupEventListeners() {
    // Button clicks
    document.getElementById('btn-learn').addEventListener('click', markAsLearned);
    document.getElementById('btn-skip').addEventListener('click', markAsUnlearned);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadWords();
        });
    });

    // Card swipe gestures
    const cardWrapper = document.getElementById('card-wrapper');
    cardWrapper.addEventListener('touchstart', handleTouchStart, false);
    cardWrapper.addEventListener('touchend', handleTouchEnd, false);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') markAsUnlearned();
        if (e.key === 'ArrowRight') markAsLearned();
    });
}

// Load words based on current tab
async function loadWords() {
    try {
        const endpoint = currentTab === 'learning' 
            ? `${API_URL}/words/learning` 
            : `${API_URL}/words/learned`;
        
        const response = await fetch(endpoint);
        currentWords = await response.json();
        currentIndex = 0;
        displayCard();
        displayWordList();
    } catch (error) {
        console.error('Error loading words:', error);
        showError('Failed to load words');
    }
}

// Display current card
function displayCard() {
    const card = document.getElementById('current-card');
    
    if (currentWords.length === 0) {
        card.innerHTML = `
            <div class="card-content">
                <div class="card-spanish">🎉</div>
                <div class="card-english">No more words in this category!</div>
            </div>
        `;
        return;
    }

    const word = currentWords[currentIndex];
    card.className = 'card ' + (word.learned ? 'learned-card' : 'learning-card');
    
    card.innerHTML = `
        <div class="card-content">
            <div class="card-spanish">${word.spanish}</div>
            <div class="card-english">${word.english}</div>
            <div class="card-example">
                <p class="example-label">Example:</p>
                <p class="example-sentence">${word.example_sentence}</p>
                <p class="example-translation">${word.example_translation}</p>
            </div>
        </div>
    `;
}

// Mark as learned
async function markAsLearned() {
    if (currentWords.length === 0) return;
    
    const word = currentWords[currentIndex];
    const card = document.getElementById('current-card');
    card.classList.add('slide-out-right');
    
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-learned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        setTimeout(() => {
            currentIndex++;
            if (currentIndex >= currentWords.length) {
                currentIndex = 0;
            }
            displayCard();
            updateStats();
            displayWordList();
        }, 300);
    } catch (error) {
        console.error('Error marking as learned:', error);
        card.classList.remove('slide-out-right');
    }
}

// Mark as unlearned
async function markAsUnlearned() {
    if (currentWords.length === 0) return;
    
    const word = currentWords[currentIndex];
    const card = document.getElementById('current-card');
    card.classList.add('slide-out-left');
    
    try {
        await fetch(`${API_URL}/words/${word.id}/mark-unlearned`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        setTimeout(() => {
            currentIndex++;
            if (currentIndex >= currentWords.length) {
                currentIndex = 0;
            }
            displayCard();
            updateStats();
            displayWordList();
        }, 300);
    } catch (error) {
        console.error('Error marking as unlearned:', error);
        card.classList.remove('slide-out-left');
    }
}

// Display word list
function displayWordList() {
    const wordList = document.getElementById('word-list');
    
    if (currentWords.length === 0) {
        wordList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No words to display</div>';
        return;
    }
    
    wordList.innerHTML = currentWords.map((word, idx) => `
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

// Update statistics
async function updateStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        document.getElementById('learned-count').textContent = stats.learned;
        document.getElementById('remaining-count').textContent = stats.remaining;
        document.getElementById('progress-percentage').textContent = Math.round(stats.progress_percentage) + '%';
        document.getElementById('progress-fill').style.width = stats.progress_percentage + '%';
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Touch swipe handlers
function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swiped left - mark as not learned
            markAsUnlearned();
        } else {
            // Swiped right - mark as learned
            markAsLearned();
        }
    }
}

// Error handling
function showError(message) {
    const card = document.getElementById('current-card');
    card.innerHTML = `
        <div class="card-content">
            <div class="card-spanish">❌</div>
            <div class="card-english">${message}</div>
        </div>
    `;
}
