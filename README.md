# Spanish Learning Cards

A web-based spaced repetition card learning game to master the 2000 most frequently used Spanish words with example sentences.

## Features

- 📇 Flash card system with the top 2000 most used Spanish words
- 🎯 Spaced repetition learning algorithm
- 👆 Swipe gestures to mark cards as learned/not learned
- 📊 Track progress with learned/to-learn categories
- 💾 Persistent progress storage
- 🔗 Shareable links - anyone can access with a link
- 📱 Responsive design for desktop and mobile
- 🌍 Example sentences for each word in context

## Tech Stack

**Frontend:**
- HTML5 / CSS3 / JavaScript (Vanilla)
- Responsive design with touch/swipe support

**Backend:**
- Python with Flask
- SQLite for progress tracking
- RESTful API

**Data:**
- Top 2000 Spanish words database
- Example sentences for each word

## Project Structure

```
spanish-learning-cards/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── models.py
│   └── data/
│       └── spanish_words.json
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

Open `frontend/index.html` in your browser or serve with a simple HTTP server.

## API Endpoints

- `GET /api/words` - Get all words
- `GET /api/words/progress` - Get learning progress
- `POST /api/words/:id/mark-learned` - Mark word as learned
- `POST /api/words/:id/mark-unlearned` - Mark word as not learned
- `GET /api/stats` - Get learning statistics

## Sharing

Share the website link with friends and they can start learning immediately!
