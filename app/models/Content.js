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
     * 🔸  LEER  (por id  ó  por lesson)
     * ----------------------------------------------------------*/
    async cargarContentPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM content WHERE id = ?', [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                // popular la instancia
                this.#id        = row.id;
                this.#lesson_id = row.lesson_id;
                this.#titulo    = row.titulo;
                this.#contenido = row.contenido;
                this.#orden     = row.orden;

                resolve(this);
            });
        });
    }

    /* -----------------------------------------------------------------
     *  Si quieres traer TODOS los contenidos de una lección y
     *  devolverlos como ARRAY de instancias Content:
     * -----------------------------------------------------------------*/
    async listarPorLessonId(lessonId) {
        return new Promise((resolve, reject) => {
            const idNum = parseInt(lessonId);
            if (isNaN(idNum)) {
                return reject(new Error('El lesson_id debe ser un número válido.'));
            }

            db.all(
                'SELECT * FROM content WHERE lesson_id = ? ORDER BY orden ASC',
                [idNum],
                (err, rows) => {
                    if (err) return reject(err);
                    const contenidos = rows.map(r =>
                        new Content(r.lesson_id, r.titulo, r.contenido, r.orden, r.id)
                    );
                    resolve(contenidos);
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR registro individual
     * ----------------------------------------------------------*/
    async eliminarContentBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) {
                return reject(new Error('No se puede eliminar un contenido sin ID.'));
            }
            db.run('DELETE FROM content WHERE id = ?', [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR por lesson_id (helper – llámalo sobre instancia vacía)
     * ----------------------------------------------------------*/
    async eliminarPorLessonId(lessonId) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM content WHERE lesson_id = ?', [lessonId], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters públicos
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getLessonId()  { return this.#lesson_id; }
    getTitulo()    { return this.#titulo; }
    getContenido() { return this.#contenido; }
    getOrden()     { return this.#orden; }
}

module.exports = Content;