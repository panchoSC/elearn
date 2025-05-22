const db = require('../data/db');

class Question {
    #id;
    #course_id;
    #question_text;
    #question_type;
    #points;
    #created_at;

    constructor(course_id, question_text, question_type = 'texto', points = 1, id = null) {
        this.#id            = id;
        this.#course_id     = parseInt(course_id);
        this.#question_text = question_text;
        this.#question_type = question_type;
        this.#points        = parseInt(points) || 1;
    }

    /* ----------------------------------------------------------
     * INSERTAR
     * ----------------------------------------------------------*/
    async guardarQuestionBD() {
        return new Promise((resolve, reject) => {
            let query=`INSERT INTO questions (course_id, question_text, question_type, points) VALUES (?,?,?,?)`;
                db.run(query, [this.#course_id, this.#question_text, this.#question_type, this.#points], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });
        });
    }

    /* ----------------------------------------------------------
     * CARGAR una pregunta por id (popular la instancia)
     * ----------------------------------------------------------*/
    async cargarQuestionPorId(question_text, course_id) {
        return new Promise((resolve, reject) => {
            let query=`SELECT id, course_id, question_text, question_type, points, created_at FROM questions WHERE question_text = ? AND course_id = ?`;
            db.get(query, [question_text, course_id], (err, row) => {
                if (err) { // Si hay un error en la consulta
                    return reject(err); // Entonmces, devolver el error
                }
                
                this.#id            = row.id;
                this.#course_id     = row.course_id;
                this.#question_text = row.question_text;
                this.#question_type = row.question_type;
                this.#points        = row.points;
                this.#created_at    = row.created_at;

                resolve(); // Devolver el usuario encontrado
            });
        });
    }

    /* ----------------------------------------------------------
     * Getters públicos
     * ----------------------------------------------------------*/
    getId()          { return this.#id; }
    getCourseId()    { return this.#course_id; }
    getTexto()       { return this.#question_text; }
    getTipo()        { return this.#question_type; }
    getPuntos()      { return this.#points; }

    setTexto(nuevoTexto){
        this.#question_text=nuevoTexto;

    }
    setTipo(nuevoTipo){
        this.#question_type=nuevoTipo;

    }
    setPuntos(nuevosPuntos){
        this.#points=nuevosPuntos;

    }
}

module.exports = Question;