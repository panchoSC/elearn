const db = require('../data/db');

class Answer {
    #id;
    #question_id;
    #answer_text;
    #is_correct;

    constructor(question_id, answer_text, is_correct = 0, id = null) {
        this.#id          = id;
        this.#question_id = parseInt(question_id);
        this.#answer_text = answer_text;
        this.#is_correct  = is_correct ? 1 : 0;  // Normalizar a 0/1
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR  ⭢  si no tiene id
     * 🔸  ACTUALIZAR ⭢  si ya tiene id
     * ----------------------------------------------------------*/
    async guardarAnswerBD() {
        return new Promise((resolve, reject) => {
            if (isNaN(this.#question_id)) {
                return reject(new Error('question_id inválido'));
            }

            // INSERT
            if (!this.#id) {
                const sql = `
                    INSERT INTO answers (question_id, answer_text, is_correct)
                    VALUES (?, ?, ?)
                `;
                db.run(sql, [this.#question_id, this.#answer_text, this.#is_correct], function (err) {
                    if (err) return reject(err);
                    resolve({ id: this.lastID });
                });
            }
            // UPDATE
            else {
                const sql = `
                    UPDATE answers
                    SET question_id = ?, answer_text = ?, is_correct = ?
                    WHERE id = ?
                `;
                db.run(sql, [this.#question_id, this.#answer_text, this.#is_correct, this.#id], function (err) {
                    if (err) return reject(err);
                    resolve({ updated: this.changes });
                });
            }
        });
    }

    /* ----------------------------------------------------------
     * 🔸  CARGAR respuesta por id  (popular instancia)
     * ----------------------------------------------------------*/
    async cargarAnswerPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM answers WHERE id = ?', [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                this.#id          = row.id;
                this.#question_id = row.question_id;
                this.#answer_text = row.answer_text;
                this.#is_correct  = row.is_correct;
                resolve(this);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR todas las respuestas de una pregunta
     *     Devuelve array de instancias Answer
     * ----------------------------------------------------------*/
    async listarPorQuestionId(questionId) {
        return new Promise((resolve, reject) => {
            const qId = parseInt(questionId);
            if (isNaN(qId)) return reject(new Error('question_id inválido'));

            db.all(
                'SELECT * FROM answers WHERE question_id = ? ORDER BY id ASC',
                [qId],
                (err, rows) => {
                    if (err) return reject(err);
                    const answers = rows.map(r =>
                        new Answer(r.question_id, r.answer_text, r.is_correct, r.id)
                    );
                    resolve(answers);
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR respuesta de la instancia actual
     * ----------------------------------------------------------*/
    async eliminarAnswerBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) {
                return reject(new Error('No se puede eliminar una respuesta sin ID.'));
            }
            db.run('DELETE FROM answers WHERE id = ?', [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR todas las respuestas de una pregunta (helper)
     *     Llamar sobre una instancia vacía:
     *         await new Answer().eliminarPorQuestionId(4);
     * ----------------------------------------------------------*/
    async eliminarPorQuestionId(questionId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM answers WHERE question_id = ?', [questionId], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters públicos
     * ----------------------------------------------------------*/
    getId()         { return this.#id; }
    getQuestionId() { return this.#question_id; }
    getTexto()      { return this.#answer_text; }
    esCorrecta()    { return !!this.#is_correct; }
}

module.exports = Answer;