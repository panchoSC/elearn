const db = require('../data/db');

class Question {
    #id;
    #course_id;
    #question_text;
    #question_type;
    #points;

    constructor(course_id, question_text, question_type = 'texto', points = 1, id = null) {
        this.#id            = id;
        this.#course_id     = parseInt(course_id);
        this.#question_text = question_text;
        this.#question_type = question_type;
        this.#points        = parseInt(points) || 1;
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR  o  ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarQuestionBD() {
        return new Promise((resolve, reject) => {
            if (isNaN(this.#course_id)) {
                return reject(new Error('course_id inválido'));
            }

            // --- INSERT ---
            if (!this.#id) {
                const sql = `
                    INSERT INTO questions (course_id, question_text, question_type, points)
                    VALUES (?, ?, ?, ?)
                `;
                db.run(sql,
                    [this.#course_id, this.#question_text, this.#question_type, this.#points],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ id: this.lastID });
                    });
            }
            // --- UPDATE ---
            else {
                const sql = `
                    UPDATE questions
                    SET course_id = ?, question_text = ?, question_type = ?, points = ?
                    WHERE id = ?
                `;
                db.run(sql,
                    [this.#course_id, this.#question_text, this.#question_type, this.#points, this.#id],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ updated: this.changes });
                    });
            }
        });
    }

    /* ----------------------------------------------------------
     * 🔸  CARGAR una pregunta por id (popular la instancia)
     * ----------------------------------------------------------*/
    async cargarQuestionPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM questions WHERE id = ?', [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                this.#id            = row.id;
                this.#course_id     = row.course_id;
                this.#question_text = row.question_text;
                this.#question_type = row.question_type;
                this.#points        = row.points;
                resolve(this);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR preguntas de un curso  (array de instancias)
     * ----------------------------------------------------------*/
    async listarPorCourseId(courseId) {
        return new Promise((resolve, reject) => {
            const cId = parseInt(courseId);
            if (isNaN(cId)) return reject(new Error('course_id inválido'));

            db.all(
                'SELECT * FROM questions WHERE course_id = ? ORDER BY id ASC',
                [cId],
                (err, rows) => {
                    if (err) return reject(err);

                    const preguntas = rows.map(r =>
                        new Question(r.course_id, r.question_text, r.question_type, r.points, r.id)
                    );
                    resolve(preguntas);
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR la pregunta de la instancia actual
     * ----------------------------------------------------------*/
    async eliminarQuestionBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) {
                return reject(new Error('No se puede eliminar una pregunta sin ID.'));
            }
            db.run('DELETE FROM questions WHERE id = ?', [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters públicos
     * ----------------------------------------------------------*/
    getId()          { return this.#id; }
    getCourseId()    { return this.#course_id; }
    getTexto()       { return this.#question_text; }
    getTipo()        { return this.#question_type; }
    getPuntos()      { return this.#points; }
}

module.exports = Question;