const sqlite3 = require('sqlite3').verbose();
const db = require('../data/db');

class Lesson {
    #id;
    #course_id;
    #titulo;
    #descripcion;
    #orden;

    constructor(id, course_id, titulo, descripcion, orden) {
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
            let query = `SELECT id, course_id, titulo, descripcion, orden FROM lessons WHERE titulo = ? AND course_id = ?`;
            db.get(query, [titulo, course_id], (err, row) => {
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

    async cargarLeccionesPorCursoId(course_id) {
        return new Promise((resolve, reject) => {
            let query = `SELECT id, course_id, titulo, descripcion, orden FROM lessons WHERE course_id = ?`;
            db.all(query, [course_id], (err, rows) => {

                if (err)   {return reject(err)};
                const lecciones = rows.map(leccion => new Lesson(
                    leccion.id,
                    leccion.course_id,
                    leccion.titulo,
                    leccion.descripcion,
                    leccion.orden,
                    
                ));
                console.log(lecciones[0].getTitulo());
                resolve(lecciones);
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

    setTitulo(nuevoTitulo){
        this.#titulo=nuevoTitulo;

    }
    setDescripcion(nuevaDescripcion){
        this.#descripcion=nuevaDescripcion;

    }
    setOrden(nuevoOrden){
        this.#orden=nuevoOrden;

    }

}

module.exports = Lesson;
