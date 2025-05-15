const db = require('../data/db');

class StudentAnswer {
    #id;
    #user_id;
    #question_id;
    #answer_id;

    constructor(user_id = null, question_id = null, answer_id = null, id = null) {
        this.#id          = id;
        this.#user_id     = user_id ? parseInt(user_id) : null;
        this.#question_id = question_id ? parseInt(question_id) : null;
        this.#answer_id   = answer_id ? parseInt(answer_id) : null;
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR (registrar una respuesta)
     *     Si la instancia no tiene id, inserta; de lo contrario hace nada
     * ----------------------------------------------------------*/
    async guardarRespuestaBD() {
        return new Promise((resolve, reject) => {
            if (this.#id) return resolve({ id: this.#id }); // ya existe

            const sql = `
                INSERT INTO student_answers (user_id, question_id, answer_id)
                VALUES (?, ?, ?)
            `;
            db.run(sql, [this.#user_id, this.#question_id, this.#answer_id], function (err) {
                if (err) return reject(err);
                resolve({ id: this.lastID });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  REGISTRAR muchas respuestas a la vez
     *     answersObj = { [questionId]: answerId, ... }
     * ----------------------------------------------------------*/
    async registrarMultiple(userId, answersObj) {
        const sql = `
            INSERT INTO student_answers (user_id, question_id, answer_id)
            VALUES (?, ?, ?)
        `;
        for (const [qId, aId] of Object.entries(answersObj)) {
            await new Promise((resolve, reject) => {
                db.run(sql, [userId, qId, aId], function (err) {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
    }

    /* ----------------------------------------------------------
     * 🔸  CARGAR registro concreto a la instancia
     * ----------------------------------------------------------*/
    async cargarPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM student_answers WHERE id = ?', [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                this.#id          = row.id;
                this.#user_id     = row.user_id;
                this.#question_id = row.question_id;
                this.#answer_id   = row.answer_id;
                resolve(this);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR respuestas de un usuario en un curso
     *     Devuelve array de instancias StudentAnswer
     * ----------------------------------------------------------*/
    async listarPorUsuarioYCurso(userId, courseId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT sa.*
                FROM student_answers sa
                JOIN questions q ON sa.question_id = q.id
                WHERE sa.user_id = ? AND q.course_id = ?
            `;
            db.all(sql, [userId, courseId], (err, rows) => {
                if (err) return reject(err);

                const lista = rows.map(r =>
                    new StudentAnswer(r.user_id, r.question_id, r.answer_id, r.id)
                );
                resolve(lista);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR registro de la instancia
     * ----------------------------------------------------------*/
    async eliminarRespuestaBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) return reject(new Error('Instancia sin ID'));

            db.run('DELETE FROM student_answers WHERE id = ?', [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getUserId()    { return this.#user_id; }
    getQuestionId(){ return this.#question_id; }
    getAnswerId()  { return this.#answer_id; }
}

module.exports = StudentAnswer;