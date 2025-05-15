/**
 * Este archivo configura y establece la conexión con una base de datos SQLite.
 * Además, inicializa las tablas necesarias para la plataforma de cursos.
 * 
 * Tablas creadas:
 * - users: Almacena información de los usuarios.
 * - courses: Almacena información de los cursos.
 * - lessons: Almacena información de las lecciones de cada curso.
 * - contents: Almacena el contenido de cada lección.
 * - enrollments: Almacena la inscripción de los usuarios en los cursos.
 * - progress: Almacena el progreso de los usuarios en las lecciones.
 * - questions: Almacena las preguntas de los tests.
 * - answers: Almacena las respuestas de los tests.
 * - student_answers: Almacena las respuestas de los estudiantes a las preguntas de los tests.
 * 
 * @module db // Exporta la conexión con la base de datos SQLite.
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "database.sqlite"), (err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err.message);
    } else {
        console.log("Conexión con la base de datos SQLite establecida.");
    }
});

const initDB = () => {
    db.serialize(() => {
        // Crear tabla 'users'
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rut TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                apellido TEXT NOT NULL,
                correo TEXT UNIQUE NOT NULL,
                contrasenia TEXT NOT NULL,
                tipo_usuario TEXT CHECK(tipo_usuario IN ('estudiante', 'docente')) NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear tabla 'courses'
        db.run(`
            CREATE TABLE IF NOT EXISTS courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE NOT NULL,
                nombre TEXT NOT NULL,
                descripcion TEXT,
                fecha_inicio TEXT,
                fecha_fin TEXT,
                estado TEXT CHECK(estado IN ('activo', 'inactivo', 'borrador')) NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE INDEX IF NOT EXISTS idx_courses_codigo 
            ON courses(codigo)
        `);

        // Crear tabla 'lessons'
        db.run(`
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                orden INTEGER,
                FOREIGN KEY(course_id) REFERENCES courses(id)
            )
        `);

        // Crear tabla 'content'
        db.run(`
            CREATE TABLE IF NOT EXISTS content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lesson_id INTEGER,
                titulo TEXT NOT NULL,
                contenido TEXT,
                orden INTEGER,
                FOREIGN KEY(lesson_id) REFERENCES lessons(id)
            )
        `);

        // Crear tabla 'enrollments'
        db.run(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
                estado TEXT CHECK(estado IN ('activo', 'completado', 'abandonado')) DEFAULT 'activo',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE(user_id, course_id)
            )
        `);

        // Crear tabla 'progress'
        db.run(`
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                lesson_id INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                last_accessed DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                UNIQUE(user_id, lesson_id)
            )
        `);

        // Crear tabla 'questions'
        db.run(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'open')) NOT NULL,
                points INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla 'answers'
        db.run(`
            CREATE TABLE IF NOT EXISTS answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question_id INTEGER NOT NULL,
                answer_text TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);

        // Crear tabla 'student_answers'
        db.run(`
            CREATE TABLE IF NOT EXISTS student_answers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                answer_id INTEGER,
                answer_text TEXT,
                is_correct BOOLEAN,
                points_earned INTEGER DEFAULT 0,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
                FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
            )
        `);

        // Insertar datos de ejemplo
        db.parallelize(() => {
            // Insertar profesores
            db.run(`INSERT OR IGNORE INTO users (rut, nombre, apellido, correo, contrasenia, tipo_usuario) VALUES 
                ('98765432-1', 'Louis', 'Armstrong', 'larmstrong@profe.cl', 'larmstrong@profe.cl', 'docente'),
                ('12349876-5', 'Ella', 'Fitzgerald', 'efitzgerald@profe.cl', 'efitzgerald@profe.cl', 'docente'),
                ('45678901-2', 'Miles', 'Davis', 'mdavis@profe.cl', 'mdavis@profe.cl', 'docente')`);

            // Insertar estudiantes
            db.run(`INSERT OR IGNORE INTO users (rut, nombre, apellido, correo, contrasenia, tipo_usuario) VALUES 
                ('56789012-3', 'Charlie', 'Parker', 'cparker@alumno.cl', 'cparker@alumno.cl', 'estudiante'),
                ('67890123-4', 'Sarah', 'Vaughan', 'svaughan@alumno.cl', 'svaughan@alumno.cl', 'estudiante'),
                ('78901234-5', 'John', 'Coltrane', 'jcoltrane@alumno.cl', 'jcoltrane@alumno.cl', 'estudiante'),
                ('89012345-6', 'Billie', 'Holiday', 'bholiday@alumno.cl', 'bholiday@alumno.cl', 'estudiante')`);

            // Insertar cursos
            db.run(`INSERT OR IGNORE INTO courses (codigo, nombre, descripcion, estado) VALUES 
                ('JAZZ101', 'Historia del Jazz', 'Introducción a la historia y evolución del jazz desde sus orígenes hasta la actualidad', 'activo'),
                ('IMPRO201', 'Técnicas de Improvisación', 'Curso avanzado de improvisación musical en el contexto del jazz', 'activo'),
                ('VOCAL301', 'Técnica Vocal Avanzada', 'Desarrollo de técnicas vocales profesionales para el jazz y géneros relacionados', 'activo'),
                ('COMP101', 'Composición Musical', 'Fundamentos de la composición musical en el jazz', 'activo'),
                ('INST101', 'Instrumentación Jazz', 'Estudio de los diferentes instrumentos y su rol en el jazz', 'borrador')`);

            // Insertar lecciones para Historia del Jazz
            db.run(`INSERT OR IGNORE INTO lessons (course_id, titulo, descripcion, orden) VALUES 
                (1, 'Orígenes del Jazz', 'Nueva Orleans y los primeros años del jazz', 1),
                (1, 'La Era del Swing', 'Big bands y la evolución del género', 2),
                (1, 'Bebop y Cool Jazz', 'La revolución del jazz moderno', 3),
                (1, 'Jazz Contemporáneo', 'Tendencias actuales y fusiones', 4)`);

            // Insertar lecciones para Técnicas de Improvisación
            db.run(`INSERT OR IGNORE INTO lessons (course_id, titulo, descripcion, orden) VALUES 
                (2, 'Fundamentos de Improvisación', 'Conceptos básicos y escalas', 1),
                (2, 'Patrones Melódicos', 'Desarrollo de vocabulario musical', 2),
                (2, 'Improvisación Modal', 'Técnicas avanzadas de improvisación', 3),
                (2, 'Ritmo y Groove', 'Aspectos rítmicos en la improvisación', 4)`);

            // Insertar contenido para las lecciones de Historia del Jazz
            db.run(`INSERT OR IGNORE INTO content (lesson_id, titulo, contenido, orden) VALUES 
                (1, 'Los Orígenes', 'El jazz nació en Nueva Orleans a principios del siglo XX...', 1),
                (1, 'Pioneros', 'Los primeros músicos que definieron el género fueron...', 2),
                (2, 'La Era Dorada', 'Las big bands transformaron el panorama musical...', 1),
                (2, 'Grandes Orquestas', 'Las orquestas más influyentes de la época...', 2),
                (3, 'Revolución Bebop', 'Charlie Parker y Dizzy Gillespie revolucionaron...', 1),
                (3, 'Cool Jazz', 'Miles Davis y el nacimiento del cool jazz...', 2)`);
                

            // Insertar contenido para las lecciones de Improvisación
            db.run(`INSERT OR IGNORE INTO content (lesson_id, titulo, contenido, orden) VALUES 
                (5, 'Escalas Básicas', 'Las escalas fundamentales para la improvisación...', 1),
                (5, 'Armonía Funcional', 'Entendiendo las progresiones armónicas...', 2),
                (6, 'Desarrollo Motívico', 'Técnicas para desarrollar motivos musicales...', 1),
                (6, 'Frases Melódicas', 'Construcción de frases coherentes...', 2)`);

            // Insertar inscripciones
            db.run(`INSERT OR IGNORE INTO enrollments (user_id, course_id, estado) VALUES 
                (4, 1, 'activo'),
                (4, 2, 'activo'),
                (5, 1, 'activo'),
                (5, 3, 'activo'),
                (6, 2, 'activo'),
                (7, 1, 'activo')`);

            // Insertar progreso
            db.run(`INSERT OR IGNORE INTO progress (user_id, lesson_id, completed, last_accessed) VALUES 
                (4, 1, true, CURRENT_TIMESTAMP),
                (4, 2, true, CURRENT_TIMESTAMP),
                (4, 3, false, CURRENT_TIMESTAMP),
                (5, 1, true, CURRENT_TIMESTAMP),
                (5, 2, false, CURRENT_TIMESTAMP),
                (6, 5, true, CURRENT_TIMESTAMP),
                (6, 6, false, CURRENT_TIMESTAMP)`);

            // Insertar preguntas de ejemplo para Historia del Jazz
            db.run(`INSERT OR IGNORE INTO questions (course_id, question_text, question_type) VALUES 
                (1, '¿En qué ciudad se originó el jazz?', 'multiple_choice'),
                (1, '¿Quién es considerado el "Rey del Swing"?', 'multiple_choice'),
                (1, '¿El jazz nació en el siglo XX?', 'true_false'),
                (1, '¿Qué músico es conocido como el padre del Cool Jazz?', 'multiple_choice'),
                (1, '¿El bebop fue anterior al swing?', 'true_false')`);

            // Insertar preguntas para Técnicas de Improvisación
            db.run(`INSERT OR IGNORE INTO questions (course_id, question_text, question_type) VALUES 
                (2, '¿Cuál es el modo más común usado en improvisación de jazz?', 'multiple_choice'),
                (2, '¿La escala pentatónica es fundamental para improvisar en blues?', 'true_false'),
                (2, '¿Qué escala es esencial para improvisar sobre acordes dominantes?', 'multiple_choice'),
                (2, '¿El II-V-I es la progresión más común en jazz?', 'true_false'),
                (2, '¿Qué instrumento es considerado líder en una jam session típica?', 'multiple_choice')`);

            // Insertar respuestas para las preguntas de Historia del Jazz
            db.run(`INSERT OR IGNORE INTO answers (question_id, answer_text, is_correct) VALUES 
                (1, 'Nueva Orleans', 1),
                (1, 'Chicago', 0),
                (1, 'Nueva York', 0),
                (1, 'Memphis', 0),
                
                (2, 'Benny Goodman', 1),
                (2, 'Duke Ellington', 0),
                (2, 'Count Basie', 0),
                (2, 'Glenn Miller', 0),
                
                (3, 'Verdadero', 1),
                (3, 'Falso', 0),
                
                (4, 'Miles Davis', 1),
                (4, 'Charlie Parker', 0),
                (4, 'John Coltrane', 0),
                (4, 'Dizzy Gillespie', 0),
                
                (5, 'Verdadero', 0),
                (5, 'Falso', 1)`);

            // Insertar respuestas para las preguntas de Técnicas de Improvisación
            db.run(`INSERT OR IGNORE INTO answers (question_id, answer_text, is_correct) VALUES 
                (6, 'Modo Dórico', 1),
                (6, 'Modo Locrio', 0),
                (6, 'Modo Frigio', 0),
                (6, 'Modo Lidio', 0),
                
                (7, 'Verdadero', 1),
                (7, 'Falso', 0),
                
                (8, 'Escala Alterada', 1),
                (8, 'Escala Mayor', 0),
                (8, 'Escala Menor Melódica', 0),
                (8, 'Escala Disminuida', 0),
                
                (9, 'Verdadero', 1),
                (9, 'Falso', 0),
                
                (10, 'Trompeta', 1),
                (10, 'Piano', 0),
                (10, 'Batería', 0),
                (10, 'Contrabajo', 0)`);
        });

        console.log("Base de datos inicializada con datos de ejemplo.");
    });
};

initDB();

module.exports = db;
