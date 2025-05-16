const db = require('../data/db');

class Lesson {
    #id;
    #course_id;
    #titulo;
    #descripcion;
    #orden;

    constructor(course_id, titulo, descripcion = '', orden = 1, id = null) {
        this.#id         = id;
        this.#course_id  = parseInt(course_id);
        this.#titulo     = titulo;
        this.#descripcion = descripcion;
        this.#orden       = parseInt(orden) || 1;
    }

    /* ----------------------------------------------------------
     * INSERTAR
     * ----------------------------------------------------------*/
    async guardarLessonBD() {
        return new Promise((resolve, reject) => {
            
            const query = `INSERT INTO lessons (course_id, titulo, descripcion, orden) VALUES (?, ?, ?, ?)`;
            db.run(query,[this.#course_id, this.#titulo, this.#descripcion, this.#orden],
                function (err) {
                    if (err) {return reject(err);}
                    else{
                        resolve({ id: this.lastID });
                    }
                });
            
        });
    }

    /* ----------------------------------------------------------
     * CARGAR lección por id   (popular la instancia)
     * ----------------------------------------------------------*/
    async cargarLessonPorId(titulo, course_id) {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM lessons WHERE titulo = ? AND course_ide = ?`;
            db.get(query, [id], (err, row) => {
                if (err)   {return reject(err)};

                this.#id          = row.id;
                this.#course_id   = row.course_id;
                this.#titulo      = row.titulo;
                this.#descripcion = row.descripcion;
                this.#orden       = row.orden;
                resolve();
            });

        });
    }

    

    /* ----------------------------------------------------------
     * Getters públicos
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getCourseId()  { return this.#course_id; }
    getTitulo()    { return this.#titulo; }
    getDescripcion(){ return this.#descripcion; }
    getOrden()     { return this.#orden; }

}

module.exports = Lesson;
