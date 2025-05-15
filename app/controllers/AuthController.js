const Usuario = require("../models/User");
const { determineUserType } = require("../utils/validators");
const { validateEmail, validatePassword, validateRUT, validateLogin } = require("../utils/validators");
const render = require("../utils/render");

/**
 * AuthController es una clase que maneja la autenticación de usuarios en la aplicación.
 * Proporciona métodos estáticos para mostrar formularios de registro e inicio de sesión,
 * procesar los datos enviados por los usuarios y manejar la lógica de autenticación.
 * 
 * Métodos:
 * - getRegister(req, res): Muestra el formulario de registro.
 * - postRegister(req, res): Procesa el registro de un nuevo usuario, validando los datos y creando el usuario en la base de datos.
 * - getLogin(req, res): Muestra el formulario de inicio de sesión.
 * - postLogin(req, res): Procesa el inicio de sesión de un usuario, validando las credenciales y estableciendo una sesión.
 * - getProfile(req, res): Muestra la página de perfil del usuario.
 * 
 * Dependencias:
 * - Rutas: Las rutas deben estar configuradas para llamar a estos métodos según corresponda.
 * - Funciones de validación: validateRUT, validateEmail, validatePassword, validateLogin.
 * - Funciones de renderizado: render.
 * - Modelo de Usuario: Usuario, que debe tener métodos como create y findByEmail.
 */

class AuthController {
    
    // Mostrar el formulario de registro
    static getRegister(req, res) {
        const html = render("registro.html", { title: "Registro", error: "", success: "" });
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    }

    // Procesar el registro de usuario
    static async postRegister(req, res) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            const formData = new URLSearchParams(body); // Parseo de los datos
            const parsedData = Object.fromEntries(formData.entries()); // Convierte a un objeto iterable
            console.log("Datos del formulario recibidos:", parsedData); // Ahora puedes usarlo para depuración
            let usuarioAux= new Usuario(formData.get("rut"), formData.get("nombre"), formData.get("apellido"), formData.get("correo"), formData.get("contrasenia"), formData.get("email").includes("@profe.cl") ? "docente" : "estudiante");
            
            // Log por si las moscas.
            console.log("Datos del formulario recibidos:", Object.fromEntries(formData)); // Aquí ya tienes los datos correctamente definidos

            // Validaciones
            if (!validateRUT(usuarioAux.getRutUsuario())) {
                const html = render("registro.html", {
                    title: "Registro",
                    error: "El RUT no es válido.",
                    success: "",
                });
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }

            if (!validateEmail(usuarioAux.getCorreo())) {
                const html = render("registro.html", {
                    title: "Registro",
                    error: "El correo electrónico no es válido.",
                    success: "",
                });
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }

            if (!validatePassword(usuario.contrasenia)) {
                const html = render("registro.html", {
                    title: "Registro",
                    error: "La contraseña debe tener al menos 6 caracteres.",
                    success: "",
                });
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }
            usuarioAux.guardarUsuarioBD()
            .then(()=>{
                
                const html = render("registro.html", {
                    title: "Registro",
                    success: "Usuario registrado exitosamente.",
                    error: "",
                });
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(html);

            })
            .catch((error)=>{
                console.error("Error al registrar usuario:", error.message);
                if (error.message.includes("UNIQUE constraint failed")) {
                    const html = render("registro.html", {
                        title: "Registro",
                        error: "El correo o el RUT ya están registrados.",
                        success: "",
                    });
                    res.writeHead(400, { "Content-Type": "text/html" });
                    res.end(html);
                } else {
                    const html = render("registro.html", {
                        title: "Registro",
                        error: "Error al registrar usuario. Intenta nuevamente.",
                        success: "",
                    });
                    res.writeHead(500, { "Content-Type": "text/html" });
                    res.end(html);
                }

            })
            
        });
    }

    // Mostrar el formulario de inicio de sesión
    static getLogin(req, res) {
        const html = render("login.html", { title: "Iniciar Sesión", error: "" });
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    }

    // Procesar el inicio de sesión
    static async postLogin(req, res) {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            const formData = new URLSearchParams(body);
            const email = formData.get("email");
            const password = formData.get("password");

            const validation = validateLogin(email, password);
            if (!validation.isValid) {
                const html = render("login.html", {
                    title: "Iniciar Sesión",
                    error: validation.error,
                });
                res.writeHead(400, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }
            let usuarioAux = new Usuario()
            try{
                
                await usuarioAux.cargarUsuarioBD(email, password);
                if(usuarioAux.getCorreo() != ''){
                    console.log('Se ha iniciado sesion !');
                    
                    res.writeHead(302, {
                        Location: "/",
                        "Set-Cookie": [
                            "loggedIn=true; Path=/; HttpOnly",
                            `email=${usuarioAux.getCorreo()}; Path=/; HttpOnly`,
                            `tipo_usuario=${usuarioAux.getTipoUsuario()}; Path=/; HttpOnly`
                        ],
                    });
                    res.end();
                    
                }
                else{
                    console.log('Credenciales incorrectas');
                    const html = render("login.html", {
                        title: "Iniciar Sesión",
                        error: "Correo o contraseña incorrectos.",
                    });
                    res.writeHead(401, { "Content-Type": "text/html" });
                    res.end(html);
                }

            }catch(error){
                console.error("Error en el login:", error.message);
                const html = render("login.html", {
                    title: "Iniciar Sesión",
                    error: "Error en el servidor. Intenta nuevamente.",
                });
                res.writeHead(500, { "Content-Type": "text/html" });
                res.end(html);                

            }
            
        });
    }

    // Mostrar la página de crear cursos, solo para los
    // profesores que tengan un correo que termine en @profe.cl
    static getCrearCursos(req, res) {
        try {
            const cookies = req.headers.cookie ? require("cookie").parse(req.headers.cookie) : {};
            const email = cookies.email; // Obtener el email desde las cookies

            if (!email) {
                res.writeHead(302, { Location: "/auth/login" });
                res.end();
                return;
            }

            // Verificar si el usuario es un profesor
            if (!email.includes("@profe.cl")) {
                const html = render("403.html", { title: "Acceso Denegado" }); // Crea una página 403
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }

            // Renderizar la página de crear cursos si es un profesor
            const html = render("crear-curso.html", { title: "Crear Curso" }, true);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (error) {
            console.error("Error en getCrearCursos:", error.message);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error interno del servidor");
        }
    }

    static getCrearLeccion(req, res) {
        try {
            const cookies = req.headers.cookie ? require("cookie").parse(req.headers.cookie) : {};
            const email = cookies.email; // Obtener el email desde las cookies

            if (!email) {
                res.writeHead(302, { Location: "/auth/login" });
                res.end();
                return;
            }

            // Verificar si el usuario es un profesor
            if (!email.includes("@profe.cl")) {
                const html = render("403.html", { title: "Acceso Denegado" }); // Crea una página 403
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(html);
                return;
            }

            // Renderizar la página de crear leccion si es un profesor
            const html = render("crear-leccion.html", { title: "Crear Leccion" }, true);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (error) {
            console.error("Error en getCrearLeccion:", error.message);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error interno del servidor");
        }
    }

    // Mostrar la página de perfil
    static async getProfile(req, res) {
        try {
            const cookies = req.headers.cookie ? require("cookie").parse(req.headers.cookie) : {};
            const email = cookies.email;
            //console.log(email);
            if (!email) {
                res.writeHead(302, { Location: "/auth/login" });
                res.end();
                return;
            }

            let usuario = new Usuario();
            await usuario.cargarDatosUsuarioCorreo(email);
            //console.log(usuario.getCorreo());
            if (usuario.getCorreo()=='') {
                res.writeHead(404, { "Content-Type": "text/html" });
                res.end(render("404.html", { title: "Usuario no encontrado" }));
                return;
            }

            const html = render(
                "perfil.html",
                {
                    title: "Perfil",
                    nombre: usuario.getNombre(),
                    apellido: usuario.getApellido(),
                    email: usuario.getCorreo(),
                    tipo_usuario: usuario.getTipoUsuario(),
                    fecha_ingreso: new Intl.DateTimeFormat('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }).format(new Date(usuario.getFechaCreacion())),
                },
                true
            );
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (error) {
            console.error("Error en getProfile:", error.message);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error interno del servidor");
        }
    }
}

module.exports = AuthController;