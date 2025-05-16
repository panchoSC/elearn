const db = require('../data/db');

class StudentAnswer {
    #id;
    #student_id;
    #question_id;
    #answer_id;
    #answer_text;
    #is_correct;
    #points_earned;
    #submitted_at;

    constructor (
        student_id   = null,
        question_id  = null,
        answer_id    = null,
        answer_text  = null,
        is_correct   = 0,
        points_earned = 0) {
            this.#student_id    = student_id  ? parseInt(student_id)  : null;
            this.#question_id   = question_id ? parseInt(question_id) : null;
            this.#answer_id     = answer_id   ? parseInt(answer_id)   : null;
            this.#answer_text   = answer_text;
            this.#is_correct    = is_correct ? 1 : 0;
            this.#points_earned = parseInt(points_earned) || 0;
  }

    /* ----------------------------------------------------------
     * INSERTAR
     * ----------------------------------------------------------*/
    async guardarRespuestaBD() {
        return new Promise((resolve, reject) => {
            let query=`INSERT INTO student_answers (student_id, question_id, answer_id, answer_text, is_correct, points_earned, submitted_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
                db.run(query, [this.#student_id, this.#question_id, this.#answer_id, this.#answer_text, this.#is_correct, this.#points_earned], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });
        });
    }

    /* ----------------------------------------------------------
     * CARGAR registro concreto a la instancia
     * ----------------------------------------------------------*/
    async cargarRespuestaBD(student_id, question_id) {
        return new Promise((resolve, reject) => {
            let query=`SELECT * FROM student_answers WHERE student_id = ? AND question_id = ?`;
            db.get(query, [student_id, question_id], (err, row) => {
                if (err) { // Si hay un error en la consulta
                    return reject(err); // Entonmces, devolver el error
                }
                
                this.#id            = row.id;
                this.#student_id    = row.student_id;
                this.#question_id   = row.question_id;
                this.#answer_id     = row.answer_id;
                this.#answer_text   = row.answer_text;
                this.#is_correct    = row.is_correct;
                this.#points_earned = row.points_earned;
                this.#submitted_at  = row.submitted_at;

                resolve(); // Devolver el usuario encontrado
            });
        });
    }

    
    /* ----------------------------------------------------------
     * Getters
     * ----------------------------------------------------------*/
    getId()            { return this.#id; }
    getStudentId()     { return this.#student_id; }
    getQuestionId()    { return this.#question_id; }
    getAnswerId()      { return this.#answer_id; }
    getAnswerText()    { return this.#answer_text; }
    esCorrecta()       { return !!this.#is_correct; }
    getPuntos()        { return this.#points_earned; }
    getFechaEnvio()    { return this.#submitted_at; }
}

module.exports = StudentAnswer;