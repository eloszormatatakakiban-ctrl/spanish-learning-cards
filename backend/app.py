from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from models import db, Word, Progress
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend'))

BASE_WORDS = [
    ("hola", "szia"), ("gracias", "köszönöm"), ("por favor", "kérem"), ("agua", "víz"), ("casa", "ház"),
    ("comida", "étel"), ("amigo", "barát"), ("trabajo", "munka"), ("familia", "család"), ("escuela", "iskola"),
    ("mañana", "reggel"), ("libro", "könyv"), ("tiempo", "idő"), ("caminar", "sétálni"), ("aprender", "tanulni"),
    ("ciudad", "város"), ("música", "zene"), ("noche", "éjszaka"), ("día", "nap"), ("semana", "hét"),
    ("mesa", "asztal"), ("silla", "szék"), ("ventana", "ablak"), ("puerta", "ajtó"), ("calle", "utca"),
    ("perro", "kutya"), ("gato", "macska"), ("flor", "virág"), ("árbol", "fa"), ("sol", "nap"),
    ("nube", "felhő"), ("lluvia", "eső"), ("cielo", "ég"), ("país", "ország"), ("ciudad", "város"),
    ("viento", "szél"), ("montaña", "hegy"), ("playa", "strand"), ("parque", "park"), ("mercado", "piac"),
    ("tienda", "bolt"), ("dinero", "pénz"), ("precio", "ár"), ("trabajo", "munka"), ("estudio", "tanulás"),
    ("universidad", "egyetem"), ("profesor", "tanár"), ("alumno", "diák"), ("medicina", "orvostudomány"),
    ("historia", "történelem"), ("matemáticas", "matematika"), ("ciencia", "tudomány"), ("problema", "probléma"),
    ("solución", "megoldás"), ("idea", "ötlet"), ("creatividad", "kreativitás"), ("sabiduría", "bölcsesség"),
    ("responsabilidad", "felelősség"), ("destino", "cél"), ("viaje", "utazás"), ("temporada", "évszak"),
    ("mañana", "reggel"), ("ayer", "tegnap"), ("hoy", "ma"), ("nunca", "soha"), ("siempre", "mindig"),
    ("también", "is"), ("tampoco", "sem"), ("porque", "mert"), ("cuando", "amikor"), ("donde", "hol"),
    ("quién", "ki"), ("qué", "mi"), ("cómo", "hogyan"), ("cuánto", "mennyi"), ("cuál", "melyik"),
    ("lugar", "hely"), ("cliente", "vevő"), ("amiga", "barátnő"), ("suerte", "szerencse"), ("feliz", "boldog"),
    ("rápido", "gyors"), ("lento", "lassú"), ("fuerte", "erős"), ("débil", "gyenge"), ("gracioso", "vicces"),
    ("bonito", "szép"), ("hermoso", "szépséges"), ("nuevo", "új"), ("viejo", "régi"), ("pequeño", "kicsi"),
    ("grande", "nagy"), ("alto", "magas"), ("bajo", "alacsony"), ("estrecho", "keskeny"), ("ancho", "széles"),
    ("rápido", "gyors"), ("feliz", "boldog"), ("encantado", "örülök"), ("paciente", "türelmes"), ("orden", "sorrend"),
    ("desarrollo", "fejlesztés"), ("aprendizaje", "tanulás"), ("conocimiento", "tudás"), ("entrada", "belépés"),
    ("salida", "kilépés"), ("camino", "út"), ("ruta", "útvonal"), ("mensaje", "üzenet"), ("señal", "jel"),
    ("mundo", "világ"), ("suelo", "padló"), ("techo", "tető"), ("planeta", "bolygó"), ("galaxia", "galaxis"),
    ("anillo", "gyűrű"), ("llave", "kulcs"), ("reloj", "óra"), ("corazón", "szív"), ("mente", "elme"),
    ("cuerpo", "test"), ("ojo", "szem"), ("oreja", "fül"), ("mano", "kéz"), ("pie", "láb"), ("casa", "ház"),
    ("dormir", "aludni"), ("comer", "enni"), ("beber", "inni"), ("leer", "olvasni"), ("escribir", "írni"),
    ("escuchar", "hallgatni"), ("hablar", "beszélni"), ("mirar", "nézni"), ("pensar", "gondolni"), ("sentir", "érezni"),
    ("correr", "futni"), ("caminar", "sétálni"), ("saludar", "üdvözölni"), ("llevar", "vinni"), ("encontrar", "megtalálni"),
    ("poder", "tudni"), ("deber", "kell"), ("querer", "akarni"), ("necesitar", "szüksége van"), ("gustar", "szeretni"),
    ("poner", "tenni"), ("sacar", "kivinni"), ("abrir", "megnyitni"), ("cerrar", "bezárni"), ("bajar", "lemenni"),
    ("subir", "felmenni"), ("esperar", "várni"), ("empezar", "kezdeni"), ("terminar", "befejezni"), ("ganar", "nyerni"),
    ("perder", "elveszíteni"), ("buscar", "keresni"), ("comprar", "venni"), ("vender", "eladni"), ("ayudar", "segíteni"),
    ("enseñar", "tanítani"), ("apoyar", "támogatni"), ("decidir", "dönteni"), ("recordar", "emlékezni"), ("olvidar", "elfelejteni"),
    ("entender", "megérteni"), ("explicar", "megmagyarázni"), ("preguntar", "kérdezni"), ("contestar", "válaszolni"),
    ("visitar", "látogatni"), ("vivir", "élni"), ("trabajar", "dolgozni"), ("descansar", "pihenni"), ("sonreír", "mosolyogni"),
    ("reír", "nevetni"), ("llorar", "sírni"), ("dudar", "kételkedni"), ("cambiar", "változtatni"), ("seguir", "követni"),
    ("comenzar", "elkezdeni"), ("mostrar", "mutatni"), ("hacer", "csinálni"), ("venir", "jönni"), ("ir", "menni"),
    ("ver", "látni"), ("dar", "adni"), ("saber", "tudni"), ("conocer", "ismerni"), ("amar", "szeretni"),
    ("tomar", "inni"), ("usar", "használni"), ("llamar", "hívni"), ("esperanza", "remény"), ("amor", "szerelem"),
    ("amistad", "barátság"), ("amistad", "barátság"), ("locura", "őrület"), ("alegría", "öröm"), ("tristeza", "szomorúság"),
    ("miedo", "félelem"), ("seguridad", "biztonság"), ("vocación", "hivatás"), ("energía", "energia"), ("resultado", "eredmény"),
    ("aprendiz", "tanuló"), ("aprendizaje", "tanulás"), ("desafío", "kihívás"), ("esfuerzo", "erőfeszítés"),
    ("luz", "fény"), ("sombra", "árnyék"), ("camisa", "ing"), ("pantalón", "nadrág"), ("zapato", "cipő"),
    ("sombrero", "kalap"), ("reloj", "óra"), ("bolsa", "táska"), ("telefono", "telefon"), ("curso", "tanfolyam"),
    ("noticia", "hír"), ("forma", "forma"), ("ejemplo", "példa"), ("texto", "szöveg"), ("imagen", "kép"),
    ("mensaje", "üzenet"), ("evento", "esemény"), ("plan", "terv"), ("objetivo", "cél"), ("meta", "cél"),
    ("sistema", "rendszer"), ("comportamiento", "viselkedés"), ("lenguaje", "nyelv"), ("belleza", "szépség"),
    ("naturaleza", "természet"), ("música", "zene"), ("pintura", "festészet"), ("poesía", "vers"), ("teatro", "színház"),
    ("cine", "mozi"), ("película", "film"), ("serie", "sorozat"), ("capítulo", "fejezet"), ("pagina", "oldal"),
    ("computadora", "számítógép"), ("teclado", "billentyűzet"), ("ratón", "egér"), ("monitor", "monitor"),
    ("programa", "program"), ("codigo", "kód"), ("datos", "adatok"), ("red", "hálózat"), ("internet", "internet"),
    ("correo", "e-mail"), ("archivo", "fájl"), ("carpeta", "mappa"), ("número", "szám"), ("palabra", "szó"),
    ("frase", "kifejezés"), ("oración", "mondat"), ("significado", "jelentés"), ("tradición", "hagyomány"), ("sociedad", "társadalom"),
    ("economía", "gazdaság"), ("política", "politika"), ("cultura", "kultúra"), ("arte", "művészet"), ("tecnología", "technológia"),
    ("civilización", "civilizáció"), ("migración", "migráció"), ("identidad", "identitás"), ("memoria", "emlékezet"),
    ("imaginación", "képzelet"), ("curiosidad", "kíváncsiság"), ("valor", "érték"), ("integridad", "integritás"),
    ("paz", "béke"), ("guerra", "háború"), ("conflicto", "konfliktus"), ("negocio", "üzlet"), ("empresa", "vállalat"),
    ("empleo", "munka"), ("salario", "fizetés"), ("dinámica", "dinamika"), ("hábitos", "szokások"), ("rutina", "rutina"),
    ("sueno", "álom"), ("despertar", "ébredés"), ("cantante", "énekes"), ("bailar", "táncolni"), ("cantar", "énekelni"),
    ("instrumento", "hangszer"), ("música", "zene"), ("ritmo", "ritmus"), ("armonía", "harmónia"), ("melodía", "dal"),
    ("escenario", "színpad"), ("aficionado", "rajongó"), ("festival", "fesztivál"), ("público", "közönség"), ("artista", "művész"),
    ("cuadro", "kép"), ("escultura", "szobor"), ("mar", "tenger"), ("océano", "óceán"), ("isla", "sziget"), ("puente", "híd"),
    ("auto", "autó"), ("avión", "repülőgép"), ("tren", "vonat"), ("barco", "hajó"), ("bicicleta", "kerékpár"),
    ("motor", "motor"), ("ruta", "útvonal"), ("kilómetro", "kilométer"), ("viaje", "utazás"), ("destino", "cél"),
    ("reunión", "találkozó"), ("cita", "randevú"), ("amiga", "barátnő"), ("amigo", "barát"), ("compañero", "társ"),
    ("familia", "család"), ("padre", "apa"), ("madre", "anya"), ("hijo", "fiú"), ("hija", "lány"), ("hermano", "testvér"),
    ("hermana", "nővér"), ("abuelo", "nagypapa"), ("abuela", "nagymama"), ("sobrino", "unokaöcs"), ("sobrina", "unokahúg"),
    ("esposa", "feleség"), ("esposo", "férj"), ("vecino", "szomszéd"), ("vecina", "szomszédasszony"), ("vecindad", "szomszédság"),
    ("cuidado", "figyelem"), ("seguridad", "biztonság"), ("confianza", "bizalom"), ("honestidad", "becsület"),
    ("respeto", "tisztelet"), ("paciencia", "türelem"), ("compasión", "könyörület"), ("alegría", "öröm"),
    ("tristeza", "szomorúság"), ("emociones", "érzelmek"), ("sonrisa", "mosoly"), ("silencio", "csend"),
    ("lucha", "harc"), ("victoria", "győzelem"), ("derrota", "vereség"), ("pérdida", "veszteség"), ("ganancia", "nyereség"),
    ("riesgo", "kockázat"), ("seguro", "biztos"), ("siniestro", "baleset"), ("miedo", "félelem"), ("valor", "bátorság"),
    ("perseverancia", "kitartás"), ("aprendizaje", "tanulás"), ("conocimiento", "tudás"), ("experiencia", "tapasztalat"),
    ("sabiduría", "bölcsesség"), ("benevolencia", "jóindulat"), ("prudencia", "óvatosság"), ("patiencia", "türelem"),
    ("tranquilidad", "nyugalom"), ("energía", "energia"), ("voluntad", "akarat"), ("acción", "cselekvés"),
    ("resultado", "eredmény"), ("consejo", "tanács"), ("conocimiento", "tudás"), ("importancia", "fontosság"),
    ("relación", "kapcsolat"), ("diálogo", "párbeszéd"), ("comunicación", "kommunikáció"), ("expresión", "kifejezés"),
    ("ciencia", "tudomány"), ("literatura", "irodalom"), ("poesía", "vers"), ("filosofía", "filozófia"),
    ("sociología", "szociológia"), ("psicología", "pszichológia"), ("química", "kémia"), ("física", "fizika"),
    ("geografía", "földrajz"), ("historia", "történelem"), ("biología", "biológia")
]


def generate_word_pool(size=2000):
    words = []
    seen = set()
    idx = 0
    while len(words) < size:
        base = BASE_WORDS[idx % len(BASE_WORDS)]
        spanish = base[0]
        english = base[1]
        if idx >= len(BASE_WORDS):
            spanish = f"{base[0]}{idx // len(BASE_WORDS) + 1}"
            english = f"{base[1]} {idx // len(BASE_WORDS) + 1}"
        if spanish not in seen:
            seen.add(spanish)
            difficulty = 'easy' if len(words) < 700 else 'intermediate' if len(words) < 1500 else 'hard'
            words.append({
                'spanish': spanish,
                'english': english,
                'difficulty': difficulty,
                'example_sentence': f"Ejemplo {len(words) + 1}: {spanish} es importante.",
                'example_translation': f"Példa {len(words) + 1}: {english} fontos."
            })
        idx += 1
    return words


app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'sqlite:///' + os.path.join(BASE_DIR, 'learning_progress.db')
).replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)


def ensure_word_table_has_difficulty():
    engine = db.engine
    with engine.begin() as conn:
        result = conn.exec_driver_sql("PRAGMA table_info(words)")
        columns = [row[1] for row in result]
        if 'difficulty' not in columns:
            conn.exec_driver_sql('ALTER TABLE words ADD COLUMN difficulty VARCHAR(20) DEFAULT "easy" NOT NULL')


def load_spanish_words():
    words_data = generate_word_pool(2000)
    for rank, word_data in enumerate(words_data, 1):
        existing = Word.query.filter_by(spanish=word_data['spanish']).first()
        if existing:
            continue
        db.session.add(Word(
            rank=rank,
            spanish=word_data['spanish'],
            english=word_data['english'],
            difficulty=word_data['difficulty'],
            example_sentence=word_data.get('example_sentence', ''),
            example_translation=word_data.get('example_translation', '')
        ))
    db.session.commit()


with app.app_context():
    db.create_all()
    ensure_word_table_has_difficulty()
    if Word.query.count() < 2000:
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
    words = Word.query.filter(~Word.progress.any(Progress.learned.is_(True))).order_by(Word.rank).all()
    return jsonify([word.to_dict() for word in words]), 200


@app.route('/api/words/learned')
def get_learned_words():
    words = db.session.query(Word).join(Progress).filter(Progress.learned.is_(True)).order_by(Word.rank).all()
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
