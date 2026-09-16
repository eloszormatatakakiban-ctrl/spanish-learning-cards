from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from models import db, Word, Progress
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='../frontend', static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///learning_progress.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)

with app.app_context():
    db.create_all()
    # Load initial data if database is empty
    if Word.query.count() == 0:
        load_spanish_words()

def load_spanish_words():
    """Load Spanish words from JSON file"""
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'spanish_words.json')
    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            words_data = json.load(f)
            for idx, word_data in enumerate(words_data, 1):
                word = Word(
                    rank=idx,
                    spanish=word_data['spanish'],
                    english=word_data['english'],
                    example_sentence=word_data.get('example_sentence', ''),
                    example_translation=word_data.get('example_translation', '')
                )
                db.session.add(word)
        db.session.commit()

# Serve website
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.isfile(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# API Routes
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/words', methods=['GET'])
def get_words():
    """Get all words with their progress status"""
    words = Word.query.order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200

@app.route('/api/words/learning', methods=['GET'])
def get_learning_words():
    """Get words that haven't been marked as learned yet"""
    words = Word.query.filter(
        ~Word.progress.any(Progress.learned == True)
    ).order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200

@app.route('/api/words/learned', methods=['GET'])
def get_learned_words():
    """Get words marked as learned"""
    learned_words = db.session.query(Word).join(Progress).filter(
        Progress.learned == True
    ).all()
    return jsonify([word.to_dict() for word in learned_words]), 200

@app.route('/api/words/<int:word_id>/mark-learned', methods=['POST'])
def mark_learned(word_id):
    """Mark a word as learned"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    
    progress = Progress.query.filter_by(word_id=word_id).first()
    if not progress:
        progress = Progress(word_id=word_id)
    
    progress.learned = True
    progress.last_reviewed = datetime.utcnow()
    db.session.add(progress)
    db.session.commit()
    
    return jsonify({'status': 'marked as learned'}), 200

@app.route('/api/words/<int:word_id>/mark-unlearned', methods=['POST'])
def mark_unlearned(word_id):
    """Mark a word as not learned"""
    word = Word.query.get(word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    
    progress = Progress.query.filter_by(word_id=word_id).first()
    if progress:
        progress.learned = False
        progress.last_reviewed = datetime.utcnow()
        db.session.add(progress)
    
    db.session.commit()
    return jsonify({'status': 'marked as unlearned'}), 200

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get learning statistics"""
    total_words = Word.query.count()
    learned_count = db.session.query(Progress).filter(
        Progress.learned == True
    ).count()
    
    return jsonify({
        'total_words': total_words,
        'learned': learned_count,
        'remaining': total_words - learned_count,
        'progress_percentage': (learned_count / total_words * 100) if total_words > 0 else 0
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
