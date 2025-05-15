const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('./data/database.sqlite');
const db = require('../data/db');

class Course {
    #id;
    #codigo;
    #nombre;
    #descripcion;
    #fecha_inicio;
    #fecha_fin;
    #estado;
    #created_at;

    constructor(
        codigo,
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin,
        estado = 'activo',
        id = null,
        created_at = null
    ) {
        this.#id          = id;
        this.#codigo      = codigo;
        this.#nombre      = nombre;
        this.#descripcion = descripcion;
        this.#fecha_inicio = fecha_inicio;
        this.#fecha_fin    = fecha_fin;
        this.#estado       = estado;
        this.#created_at   = created_at;
    }

    /* ----------------------------------------------------------
     * 🔸  INSERTAR o ACTUALIZAR
     * ----------------------------------------------------------*/
    async guardarCursoBD(course) {
        return new Promise(async (resolve, reject) => {
            try {
                // Si el curso no tiene id ⇒ INSERT
                if (!this.#id) {
                    // Verificar unicidad del código
                    const codigoDisponible = await this.#validarCodigoUnico(this.#codigo);
                    if (!codigoDisponible) {
                        return reject(new Error('El código del curso ya existe'));
                    }

                    const insertSQL = `
                        INSERT INTO courses (codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    db.run(
                        insertSQL,
                        [
                            this.#codigo,
                            this.#nombre,
                            this.#descripcion,
                            this.#fecha_inicio,
                            this.#fecha_fin,
                            this.#estado
                        ],
                        function (err) {
                            if (err) return reject(err);
                            // Establecer id y created_at en la instancia
                            resolve({ id: this.lastID });
                        }
                    );
                }
                // Si ya tiene id ⇒ UPDATE
                else {
                    const updateSQL = `
                        UPDATE courses
                        SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
                        WHERE id = ?
                    `;
                    db.run(
                        updateSQL,
                        [
                            this.#nombre,
                            this.#descripcion,
                            this.#fecha_inicio,
                            this.#fecha_fin,
                            this.#estado,
                            this.#id
                        ],
                        function (err) {
                            if (err) return reject(err);
                            resolve({ updated: this.changes });
                        }
                    );
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LEER (por id)
     * ----------------------------------------------------------*/
    async cargarCursoBD(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM courses WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err)   return reject(err);
                if (!row)  return resolve(null);

                // Popular la instancia
                this.#id           = row.id;
                this.#codigo       = row.codigo;
                this.#nombre       = row.nombre;
                this.#descripcion  = row.descripcion;
                this.#fecha_inicio = row.fecha_inicio;
                this.#fecha_fin    = row.fecha_fin;
                this.#estado       = row.estado;
                this.#created_at   = row.created_at;

                resolve(this);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  ELIMINAR
     * ----------------------------------------------------------*/
    async eliminarCursoBD() {
        return new Promise((resolve, reject) => {
            if (!this.#id) {
                return reject(new Error('No se puede eliminar un curso sin ID'));
            }
            const sql = `DELETE FROM courses WHERE id = ?`;
            db.run(sql, [this.#id], function (err) {
                if (err) return reject(err);
                resolve({ deleted: this.changes });
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  OBTENER ÚLTIMO CÓDIGO (para generar el siguiente)
     *     Se usa sobre una instancia vacía:
     *        const helper = new Course();
     *        const ultimo = await helper.obtenerUltimoCodigo();
     * ----------------------------------------------------------*/
    async obtenerUltimoCodigo() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT codigo FROM courses ORDER BY CAST(codigo AS INTEGER) DESC LIMIT 1`;
            db.get(sql, [], (err, row) => {
                if (err) return reject(err);
                resolve(row ? row.codigo : null);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  LISTAR TODOS (devuelve array de instancias Course)
     *     new Course().listarTodosLosCursos().then(cursos => ...)
     * ----------------------------------------------------------*/
    async listarTodosLosCursos() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, codigo, nombre, descripcion,
                       fecha_inicio, fecha_fin, estado, created_at
                FROM courses
                ORDER BY created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);

                const cursos = rows.map(r => new Course(
                    r.codigo,
                    r.nombre,
                    r.descripcion,
                    r.fecha_inicio,
                    r.fecha_fin,
                    r.estado,
                    r.id,
                    r.created_at
                ));
                resolve(cursos);
            });
        });
    }

    /* ----------------------------------------------------------
     * 🔸  Getters públicos
     * ----------------------------------------------------------*/
    getId()          { return this.#id; }
    getCodigo()      { return this.#codigo; }
    getNombre()      { return this.#nombre; }
    getDescripcion() { return this.#descripcion; }
    getFechaInicio() { return this.#fecha_inicio; }
    getFechaFin()    { return this.#fecha_fin; }
    getEstado()      { return this.#estado; }
    getCreado()      { return this.#created_at; }

    /* ==========================================================
     * 🔒  MÉTODOS PRIVADOS
     * ==========================================================*/
    #validarCodigoUnico(codigo) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT COUNT(*) as count FROM courses WHERE codigo = ?';
            db.get(sql, [codigo], (err, row) => {
                if (err) return reject(err);
                resolve(row.count === 0);
            });
        });
    }
}

module.exports = Course;