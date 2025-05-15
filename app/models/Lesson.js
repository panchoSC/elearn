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
     * 🔸  INSERTAR  o  ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarLessonBD() {
        return new Promise((resolve, reject) => {
            if (isNaN(this.#course_id)) {
                return reject(new Error('course_id inválido'));
            }

            // INSERT
            if (!this.#id) {
                const sql = `
                    INSERT INTO lessons (course_id, titulo, descripcion, orden)
                    VALUES (?, ?, ?, ?)
                `;
                db.run(sql,
                    [this.#course_id, this.#titulo, this.#descripcion, this.#orden],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ id: this.lastID });
                    });
            }
            // UPDATE
            else {
                const sql = `
                    UPDATE lessons
                    SET course_id = ?, titulo = ?, descripcion = ?, orden = ?
                    WHERE id = ?
                `;
                db.run(sql,
                    [this.#course_id, this.#titulo, this.#descripcion, this.#orden, this.#id],
                    function (err) {
                        if (err) return reject(err);
                        resolve({ updated: this.changes });
                    });
            }
        });
    }

    /* ----------------------------------------------------------
     * 🔸  CARGAR lección por id   (popular la instancia)
     * ----------------------------------------------------------*/
    async cargarLessonPorId(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM lessons WHERE id = ?', [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                this.#id          = row.id;
                this.#course_id   = row.course_id;
                this.#titulo      = row.titulo;
                this.#descripcion = row.descripcion;
                this.#orden       = row.orden;
                resolve(this);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR todas las lecciones de un curso
     *     Devuelve array de instancias Lesson
     * ----------------------------------------------------------*/
    async listarPorCourseId(courseId) {
        return new Promise((resolve, reject) => {
            const cId = parseInt(courseId);
            if (isNaN(cId)) return reject(new Error('course_id inválido'));

            db.all(
                'SELECT * FROM lessons WHERE course_id = ? ORDER BY orden ASC',
                [cId],
                (err, rows) => {
                    if (err) return reject(err);

                    const lecciones = rows.map(r =>
                        new Lesson(r.course_id, r.titulo, r.descripcion, r.orden, r.id)
                    );
                    resolve(lecciones);
                }
            );
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR la lección de la instancia actual
     * ----------------------------------------------------------*/
    async eliminarLessonBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) {
                return reject(new Error('No se puede eliminar una lección sin ID.'));
            }
            db.run('DELETE FROM lessons WHERE id = ?', [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters públicos
     * ----------------------------------------------------------*/
    getId()        { return this.#id; }
    getCourseId()  { return this.#course_id; }
    getTitulo()    { return this.#titulo; }
    getDescripcion(){ return this.#descripcion; }
    getOrden()     { return this.#orden; }

    /* Opcional: setters seguros si los necesitas */
}

module.exports = Lesson;
