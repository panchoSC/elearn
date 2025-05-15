const db = require('../data/db');

class Progress {
    #id;
    #user_id;
    #lesson_id;
    #completed;
    #last_accessed;

    constructor(user_id, lesson_id, completed = 0, last_accessed = null, id = null) {
        this.#id            = id;
        this.#user_id       = parseInt(user_id);
        this.#lesson_id     = parseInt(lesson_id);
        this.#completed     = completed ? 1 : 0;            // 0 / 1
        this.#last_accessed = last_accessed;                // string ISO o null
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR  o  ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarProgressBD() {
        return new Promise((resolve, reject) => {
            if (isNaN(this.#user_id) || isNaN(this.#lesson_id)) {
                return reject(new Error('user_id o lesson_id inválido'));
            }

            // ----- INSERT -----
            if (!this.#id) {
                const sql = `
                    INSERT INTO progress (user_id, lesson_id, completed, last_accessed)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                `;
                db.run(sql,
                    [this.#user_id, this.#lesson_id, this.#completed],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ id: this.lastID });
                    });
            }
            // ----- UPDATE -----
            else {
                const sql = `
                    UPDATE progress
                    SET completed = ?, last_accessed = CURRENT_TIMESTAMP
                    WHERE id = ?
                `;
                db.run(sql, [this.#completed, this.#id], function (err) {
                    if (err) return reject(err);
                    resolve({ updated: this.changes });
                });
            }
        });
    }

    /* ----------------------------------------------------------
     * 🔸  CARGAR registro por user + lesson
     * ----------------------------------------------------------*/
    async cargarProgress(userId, lessonId) {
        return new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM progress WHERE user_id = ? AND lesson_id = ?`,
                [userId, lessonId],
                (err, row) => {
                    if (err)   return reject(err);
                    if (!row)  return resolve(null);

                    this.#id            = row.id;
                    this.#user_id       = row.user_id;
                    this.#lesson_id     = row.lesson_id;
                    this.#completed     = row.completed;
                    this.#last_accessed = row.last_accessed;
                    resolve(this);
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR progreso por usuario  (array de instancias)
     * ----------------------------------------------------------*/
    async listarPorUserId(userId) {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM progress WHERE user_id = ?`, [userId], (err, rows) => {
                if (err) return reject(err);

                const lista = rows.map(r =>
                    new Progress(r.user_id, r.lesson_id, r.completed, r.last_accessed, r.id)
                );
                resolve(lista);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR progreso por usuario + curso
     * ----------------------------------------------------------*/
    async listarPorUserYCurso(userId, courseId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT p.*, l.id as lesson_id
                FROM progress p
                JOIN lessons l ON p.lesson_id = l.id
                WHERE p.user_id = ? AND l.course_id = ?
            `;
            db.all(sql, [userId, courseId], (err, rows) => {
                if (err) return reject(err);

                const lista = rows.map(r =>
                    new Progress(r.user_id, r.lesson_id, r.completed, r.last_accessed, r.id)
                );
                resolve(lista);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Marcar como completado para la instancia
     * ----------------------------------------------------------*/
    async marcarCompletado() {
        this.#completed = 1;
        return this.guardarProgressBD();
    }

    /* ----------------------------------------------------------
     * 🔸  Actualizar solo el last_accessed
     * ----------------------------------------------------------*/
    async actualizarUltimoAcceso() {
        return new Promise((resolve, reject) => {
            if (!this.#id) return reject(new Error('Instancia sin ID'));

            db.run(
                `UPDATE progress SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?`,
                [this.#id],
                function (err) {
                    if (err) return reject(err);
                    resolve({ updated: this.changes });
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getUserId()    { return this.#user_id; }
    getLessonId()  { return this.#lesson_id; }
    estaCompleto() { return !!this.#completed; }
    getLastAccess(){ return this.#last_accessed; }
}

module.exports = Progress;
