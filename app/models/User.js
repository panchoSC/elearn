/**
 * Este módulo define la clase `Usuario` que interactúa con la base de datos para realizar operaciones CRUD relacionadas con los usuarios.
 * 
 * Depende de:
 * - `../data/db`: El módulo de base de datos que proporciona métodos para ejecutar consultas SQL.
 * 
 * Métodos:
 * 
 * - `create({ rut, nombre, apellido, correo, contrasenia, tipo_usuario })`: 
 *   Crea un nuevo usuario en la base de datos.
 *   @param {Object} user - Objeto que contiene los datos del usuario.
 *   @param {string} user.rut - RUT del usuario.
 *   @param {string} user.nombre - Nombre del usuario.
 *   @param {string} user.apellido - Apellido del usuario.
 *   @param {string} user.correo - Correo electrónico del usuario.
 *   @param {string} user.contrasenia - Contraseña del usuario.
 *   @param {string} user.tipo_usuario - Tipo de usuario.
 *   @returns {Promise<Object>} Promesa que resuelve con el ID del nuevo usuario.
 * 
 * - `findByEmail(correo)`:
 *   Busca un usuario en la base de datos por su correo electrónico.
 *   @param {string} correo - Correo electrónico del usuario.
 *   @returns {Promise<Object|null>} Promesa que resuelve con el usuario encontrado o null si no existe.
 * 
 * - `findAll()`:
 *   Busca todos los usuarios en la base de datos.
 *   @returns {Promise<Array>} Promesa que resuelve con una lista de todos los usuarios.
 */
const db = require("../data/db");

class Usuario {
    #rut;
    #nombre;
    #apellido;
    #correo;
    #contrasenia;
    #tipo_usuario;
    #created_at;

    constructor (rut, nombre, apellido, correo, contrasenia, tipo_usuario){
        this.#rut = rut;
        this.#nombre = nombre;
        this.apellido = apellido;
        this.correo = correo;
        this.#contrasenia = contrasenia;
        this.#tipo_usuario = tipo_usuario;

    }
    

    async guardarUsuarioBD(){
        return new Promise((resolve, reject)=>{
            let query=`INSERT INTO users (rut, nombre, apellido, correo, contrasenia, tipo_usuario)
                VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(query, [this.#rut, this.#nombre, this.#apellido, this.#correo, this.#contrasenia, this.#tipo_usuario], function (err) {
                    if (err) {
                        reject(err); // Error durante la inserción
                    } else {
                        resolve({ id: this.lastID }); // Éxito
                    }
                });

        })

    }

    async cargarUsuarioBD(correo, contrasenia){
        return new Promise((resolve, reject)=>{
            let query=`SELECT rut, nombre, apellido, correo, contrasenia, tipo_usuario, created_at FROM users WHERE correo=? AND contrasenia=?`;
            db.get(query, [correo, contrasenia], (err, row) => {
                if (err) { // Si hay un error en la consulta
                    return reject(err); // Entonmces, devolver el error
                }
                
                this.#rut=row.rut;
                this.#nombre=row.nombre;
                this.#apellido=row.apellido;
                this.#correo=row.correo;
                this.#contrasenia=row.contrasenia;
                this.#tipo_usuario=row.tipo_usuario;
                this.#created_at=row.created_at;

                resolve(); // Devolver el usuario encontrado
            });

        })

    }

    async cargarDatosUsuarioCorreo(correo){
        return new Promise((resolve, reject)=>{
            let query=`SELECT rut, nombre, apellido, correo, contrasenia, tipo_usuario, created_at FROM users WHERE correo=?`;
            db.get(query, [correo], (err, row) => {
                if (err) { // Si hay un error en la consulta
                    return reject(err); // Entonmces, devolver el error
                }
                
                this.#rut=row.rut;
                this.#nombre=row.nombre;
                this.#apellido=row.apellido;
                this.#correo=row.correo;
                this.#contrasenia=row.contrasenia;
                this.#tipo_usuario=row.tipo_usuario;
                this.#created_at=row.created_at;
                
                resolve(); // Devolver el usuario encontrado
            });

        })

    }

    getCorreo(){
        return this.#correo;
    }

    getTipoUsuario(){
        return this.#tipo_usuario;
    }
    getRutUsuario(){
        return this.#rut;
    }
    getNombre(){
        return this.#nombre;
    }
    getApellido(){
        return this.#apellido;
    }
    getFechaCreacion(){
        return this.#created_at;

    }
    // // Buscar un usuario por correo
    // void async findByEmail(email) { // Buscar un usuario por su correo electrónico
    //     // Diferencia entre email y correo = email es un objeto, correo es un string
    //     return new Promise((resolve, reject) => {
    //         const query = "SELECT * FROM users WHERE correo = ?"; // Consulta SQL
    //         db.get(query, [email], (err, row) => {
    //             if (err) { // Si hay un error en la consulta
    //                 return reject(err); // Entonmces, devolver el error
    //             }
    //             resolve(row); // Devolver el usuario encontrado
    //         });
    //     });
    // }

    // // Buscar todos los usuarios
    // static findAll() {
    //     return new Promise((resolve, reject) => {
    //         const query = `
    //             SELECT * FROM users
    //         `;
    //         db.all(query, [], (err, rows) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(rows);
    //             }
    //         });
    //     });
    // }

    // // Add this method to the Usuario class
    // static getEnrollments(userId) {
    //     return new Promise((resolve, reject) => {
    //         const query = `
    //             SELECT e.*, c.nombre as course_name 
    //             FROM enrollments e
    //             JOIN courses c ON e.course_id = c.id
    //             WHERE e.user_id = ?
    //             ORDER BY e.fecha_inscripcion DESC
    //         `;
            
    //         db.all(query, [userId], (err, rows) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve(rows);
    //             }
    //         });
    //     });
    // }
}

module.exports = Usuario;
