const db = require('../data/db');

class Answer {
    #id;
    #question_id;
    #answer_text;
    #is_correct;
    #created_at;

    constructor(question_id, answer_text, is_correct = 0) {
        this.#question_id = parseInt(question_id);
        this.#answer_text = answer_text;
        this.#is_correct  = is_correct ? 1 : 0;  // Normalizar a 0/1
    }

    /* ----------------------------------------------------------
     * INSERTAR  ⭢  si no tiene id
     * ACTUALIZAR ⭢  si ya tiene id
     * ----------------------------------------------------------*/
    async guardarAnswerBD() {
        return new Promise((resolve, reject) => {
            let query=`INSERT INTO answers (question_id, answer_text, is_correct)
                VALUES (?, ?, ?)`;
                db.run(query, [], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });
        });
    }

    /* ----------------------------------------------------------
     * CARGAR respuesta por id  (popular instancia)
     * ----------------------------------------------------------*/
    async cargarAnswerBD(answer_text, question_id) {
        return new Promise((resolve, reject) => {
            let query = `SELECT question_id, answer_text, is_correct FROM answers WHERE answer_text = ? AND question_id = ?`;
            db.get(query, [answer_text, question_id], (err, row) => {
                if (err)   {return reject(err)};

                this.#question_id = row.question_id;
                this.#answer_text = row.answer_text;
                this.#is_correct  = row.is_correct;
                resolve();
            });

        });
    }

    
    /* ----------------------------------------------------------
     * Getters públicos
     * ----------------------------------------------------------*/
    getId()         { return this.#id; }
    getQuestionId() { return this.#question_id; }
    getTexto()      { return this.#answer_text; }
    esCorrecta()    { return this.#is_correct; }
    getFechaCreacion(){ return this.#created_at; }

    setTexto(nuevoTexto){
        this.#answer_text=nuevoTexto;

    }
}

module.exports = Answer;