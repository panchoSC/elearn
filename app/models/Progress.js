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
     * INSERTAR  o  ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarProgressBD() {
        return new Promise((resolve, reject) => {
            let query = `INSERT INTO progress (user_id, lesson_id, completed, last_accessed) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
            db.run(query,[this.#user_id, this.#lesson_id, this.#completed],
                function (err) {
                    if (err) {return reject(err);}
                    else{
                        resolve({ id: this.lastID });
                    }
                });
        });
    }

    /* ----------------------------------------------------------
     * CARGAR registro por user + lesson
     * ----------------------------------------------------------*/
    async cargarProgressBD(user_id, lesson_id) {
        return new Promise((resolve, reject) => {
            let query = `SELECT id, user_id, lesson_id, completed, last_accessed FROM progress WHERE user_id = ? AND lesson_id = ?`;
            db.get(query, [user_id, lesson_id], (err, row) => {
                if (err)   {return reject(err);}
                this.#id            = row.id;
                this.#user_id       = row.user_id;
                this.#lesson_id     = row.lesson_id;
                this.#completed     = row.completed;
                this.#last_accessed = row.last_accessed;
                resolve();
            });
        })
    }

    
    /* ----------------------------------------------------------
     * Getters
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getUserId()    { return this.#user_id; }
    getLessonId()  { return this.#lesson_id; }
    estaCompleto() { return this.#completed; }
    getLastAccess(){ return this.#last_accessed; }
}

module.exports = Progress;
