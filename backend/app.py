from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models import db, Word, Progress
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'sqlite:///' + os.path.join(BASE_DIR, 'learning_progress.db')
).replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)


def load_spanish_words():
    """Load Spanish words from JSON on first startup."""
    data_path = os.path.join(BASE_DIR, 'data', 'spanish_words.json')
    if not os.path.exists(data_path):
        return

    with open(data_path, 'r', encoding='utf-8') as file:
        words_data = json.load(file)

    for rank, word_data in enumerate(words_data, 1):
        db.session.add(Word(
            rank=rank,
            spanish=word_data['spanish'],
            english=word_data['english'],
            example_sentence=word_data.get('example_sentence', ''),
            example_translation=word_data.get('example_translation', '')
        ))
    db.session.commit()


# This must come after the function definition above.
with app.app_context():
    db.create_all()
    if Word.query.count() == 0:
        load_spanish_words()


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    requested_file = os.path.join(app.static_folder, path)
    if os.path.isfile(requested_file):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'}), 200


@app.route('/api/words')
def get_words():
    words = Word.query.order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200


@app.route('/api/words/learning')
def get_learning_words():
    words = Word.query.filter(
        ~Word.progress.any(Progress.learned.is_(True))
    ).order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200


@app.route('/api/words/learned')
def get_learned_words():
    words = db.session.query(Word).join(Progress).filter(
        Progress.learned.is_(True)
    ).order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200


@app.route('/api/words/<int:word_id>/mark-learned', methods=['POST'])
def mark_learned(word_id):
    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    progress = Progress.query.filter_by(word_id=word_id).first()
    if progress is None:
        progress = Progress(word_id=word_id)
    progress.learned = True
    progress.last_reviewed = datetime.utcnow()
    progress.times_reviewed = (progress.times_reviewed or 0) + 1
    db.session.add(progress)
    db.session.commit()
    return jsonify({'status': 'marked as learned'}), 200


@app.route('/api/words/<int:word_id>/mark-unlearned', methods=['POST'])
def mark_unlearned(word_id):
    word = db.session.get(Word, word_id)
    if not word:
        return jsonify({'error': 'Word not found'}), 404

    progress = Progress.query.filter_by(word_id=word_id).first()
    if progress is None:
        progress = Progress(word_id=word_id)
    progress.learned = False
    progress.last_reviewed = datetime.utcnow()
    progress.times_reviewed = (progress.times_reviewed or 0) + 1
    db.session.add(progress)
    db.session.commit()
    return jsonify({'status': 'marked as unlearned'}), 200


@app.route('/api/stats')
def get_stats():
    total_words = Word.query.count()
    learned_count = Progress.query.filter(Progress.learned.is_(True)).count()
    return jsonify({
        'total_words': total_words,
        'learned': learned_count,
        'remaining': total_words - learned_count,
        'progress_percentage': learned_count / total_words * 100 if total_words else 0
    }), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
