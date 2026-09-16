from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Word(db.Model):
    __tablename__ = 'words'
    
    id = db.Column(db.Integer, primary_key=True)
    rank = db.Column(db.Integer, unique=True, nullable=False)  # 1-2000
    spanish = db.Column(db.String(100), nullable=False, unique=True)
    english = db.Column(db.String(100), nullable=False)
    example_sentence = db.Column(db.Text)  # Spanish example
    example_translation = db.Column(db.Text)  # English translation
    progress = db.relationship('Progress', backref='word', lazy=True, cascade='all, delete-orphan')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        progress = Progress.query.filter_by(word_id=self.id).first()
        return {
            'id': self.id,
            'rank': self.rank,
            'spanish': self.spanish,
            'english': self.english,
            'example_sentence': self.example_sentence,
            'example_translation': self.example_translation,
            'learned': progress.learned if progress else False,
            'last_reviewed': progress.last_reviewed.isoformat() if progress and progress.last_reviewed else None
        }

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.Integer, db.ForeignKey('words.id'), nullable=False, unique=True)
    learned = db.Column(db.Boolean, default=False)
    last_reviewed = db.Column(db.DateTime, default=datetime.utcnow)
    times_reviewed = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'word_id': self.word_id,
            'learned': self.learned,
            'last_reviewed': self.last_reviewed.isoformat(),
            'times_reviewed': self.times_reviewed
        }
