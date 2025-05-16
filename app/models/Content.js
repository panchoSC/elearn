const db = require('../data/db');

class Content {
    #id;
    #lesson_id;
    #titulo;
    #contenido;
    #orden;

    constructor(titulo, contenido, orden = -1, id = null, lesson_id= -1) {
        this.#id        = id;
        this.#lesson_id = parseInt(lesson_id);
        this.#titulo    = titulo;
        this.#contenido = contenido;
        this.#orden     = parseInt(orden) || 1;
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR  o  ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarContentBD() {
        return new Promise((resolve, reject)=>{
            let query=`INSERT INTO content (titulo, contenido, lesson_id)
                VALUES (?, ?, ?)`;
                db.run(query, [this.#titulo, this.#contenido, this.#lesson_id], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });

        })
    }

    /* ----------------------------------------------------------
     * LEER
     * ----------------------------------------------------------*/
    async cargarContentBD(titulo, lesson_id) {
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM content WHERE titulo = ? AND lesson_id = ?`;
            db.get(query, [titulo, lesson_id], (err, row) => {
                if (err)   {return reject(err);}

                // popular la instancia
                this.#id        = row.id;
                this.#lesson_id = row.lesson_id;
                this.#titulo    = row.titulo;
                this.#contenido = row.contenido;
                this.#orden     = row.orden;

                resolve();
            });
        });
    }

    /* ----------------------------------------------------------
     * Getters públicos
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getLessonId()  { return this.#lesson_id; }
    getTitulo()    { return this.#titulo; }
    getContenido() { return this.#contenido; }
    getOrden()     { return this.#orden; }
}

module.exports = Content;