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

// Inicializar las tablas de la base de datos !!!
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

        // Crear índice para el código de curso si no existe
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

        // Crear tabla 'contents'
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

        // crear tabla 'enrollments':
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

        // Add these new tables to the initDB function
        db.run(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                course_id INTEGER NOT NULL,
                lesson_id INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'open')) NOT NULL,
                points INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

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

        console.log("Tablas inicializadas.");
    });
};

initDB();

module.exports = db;
