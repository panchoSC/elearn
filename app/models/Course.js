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
     * INSERTAR
     * ----------------------------------------------------------*/
    async guardarCursoBD() {
        return new Promise((resolve, reject) => {
            let query=`INSERT INTO courses (codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado)
                VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(query, [this.#codigo, this.#nombre, this.#descripcion, this.#fecha_inicio, this.#fecha_fin, this.#estado], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });
                
        });
    }
    

    /* ----------------------------------------------------------
     * LEER (por codigo)
     * ----------------------------------------------------------*/
    async cargarCursoBD(codigo) {
        return new Promise((resolve, reject) => {
            let query = `SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado, created_at FROM courses WHERE codigo = ?`;
            db.get(query, [codigo], (err, row) => {   
                if (err)   {return reject(err)};
                this.#id           = row.id;
                this.#codigo       = row.codigo;
                this.#nombre       = row.nombre;
                this.#descripcion  = row.descripcion;
                this.#fecha_inicio = row.fecha_inicio;
                this.#fecha_fin    = row.fecha_fin;
                this.#estado       = row.estado;
                this.#created_at   = row.created_at;
                resolve();                       // instancia poblada
            });

            
        });
    }

    async listarTodosLosCursos() {
        return new Promise((resolve, reject) => {
            let sql = `
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

    async obtenerCursoPorId(id){
         return new Promise((resolve, reject) => {
            let query = `SELECT id, codigo, nombre, descripcion, fecha_inicio, fecha_fin, estado, created_at FROM courses WHERE id = ?`;
            db.get(query, [id], (err, row) => {   
                if (err)   {return reject(err)};
                this.#id           = row.id;
                this.#codigo       = row.codigo;
                this.#nombre       = row.nombre;
                this.#descripcion  = row.descripcion;
                this.#fecha_inicio = row.fecha_inicio;
                this.#fecha_fin    = row.fecha_fin;
                this.#estado       = row.estado;
                this.#created_at   = row.created_at;
                resolve();                       // instancia poblada
            });

            
        });
    }
    async editarCursoBD(){
        return new Promise((resolve, reject) => {
            let query = `UPDATE courses SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
            WHERE codigo = ?`;
            db.run(query, [this.#nombre, this.#descripcion, this.#fecha_inicio, this.#fecha_fin, this.#estado],
            function (err) {
                if (err) {
                    reject(err); // Error durante la inserción
                } else {
                    resolve(); // Éxito
                }
            });
        });
    }

    /* ----------------------------------------------------------
     * Getters públicos
     * ----------------------------------------------------------*/
    getId()          { return this.#id; }
    getCodigo()      { return this.#codigo; }
    getNombre()      { return this.#nombre; }
    getDescripcion() { return this.#descripcion; }
    getFechaInicio() { return this.#fecha_inicio; }
    getFechaFin()    { return this.#fecha_fin; }
    getEstado()      { return this.#estado; }
    getCreado()      { return this.#created_at; }

    setCodigo(nuevoCodigo){
        this.#codigo=nuevoCodigo;

    }
    setNombre(nuevoNombre){
        this.#nombre=nuevoNombre;

    }
    setDescripcion(nuevaDescripcion){
        this.#descripcion=nuevaDescripcion;

    }
    setFechaInicio(nuevaFechaInicio){
        this.#fecha_inicio=nuevaFechaInicio;

    }
    setFechaFin(nuevaFechaFin){
        this.#fecha_fin=nuevaFechaFin;

    }
    setEstado(nuevoEstado){
        this.#estado=nuevoEstado;

    }
    
}

module.exports = Course;