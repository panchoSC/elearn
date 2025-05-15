const AuthController = require("../controllers/AuthController");
const render = require("../utils/render");
const cookie = require("cookie");
const Usuario = require("../models/User");
const CourseController = require("../controllers/CourseController");
const LessonController = require("../controllers/LessonController");
const ContentController = require("../controllers/ContentController");

const rutas = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    try {
        const cookies = cookie.parse(req.headers.cookie || "");
        const isAuthenticated = cookies.loggedIn === "true";
        const email = cookies.email || "";
        const tipo_usuario = cookies.tipo_usuario || "none";
        let userRole = "";
        let userId = null;
        console.log("¿Está logeado (isAuthenticated)?:", isAuthenticated, "Rol:", tipo_usuario);

        // Home route
        if (req.url === "/" && req.method === "GET") {
            const html = render("index.html", { title: "Inicio" }, isAuthenticated, tipo_usuario);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
            return;
        }

        // Login routes
        if (req.url === "/auth/login" && req.method === "GET") {
            if (isAuthenticated) {
                res.writeHead(302, { Location: "/" });
                res.end();
                return;
            }
            return AuthController.getLogin(req, res);
        }

        if (req.url === "/auth/login" && req.method === "POST") {
            return AuthController.postLogin(req, res);
        }

        // Register routes
        if (req.url === "/auth/registro" && req.method === "GET") {
            if (isAuthenticated) {
                res.writeHead(302, { Location: "/" });
                res.end();
                return;
            }
            return AuthController.getRegister(req, res);
        }

        if (req.url === "/auth/registro" && req.method === "POST") {
            return AuthController.postRegister(req, res);
        }

        // Logout route
        if (req.url === "/logout" && req.method === "GET") {
            res.writeHead(302, {
                Location: "/auth/login",
                "Set-Cookie": "loggedIn=false; Path=/; HttpOnly",
            });
            res.end();
            return;
        }

        // Profile route
        if (req.url === "/perfil" && req.method === "GET") {
            if (!isAuthenticated) {
                res.writeHead(302, { Location: "/auth/login" });
                res.end();
                return;
            }
            return AuthController.getProfile(req, res);
        }

        // Create course route (only accessible by "docente")
        if (req.url === "/crear-cursos" && req.method === "GET") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            return AuthController.getCrearCursos(req, res);
        }

        // Handle POST requests for creating course
        if (req.method === 'POST' && req.url === '/courses/create') {
            return CourseController.create(req, res);
        }

        // Create lesson route (only accessible by "docente")
        if (req.url === "/crear-leccion" && req.method === "GET") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            return AuthController.getCrearLeccion(req, res);
        }

        // Handle POST requests for creating lesson
        if (req.method === 'POST' && req.url === '/lessons/create') {
            return LessonController.create(req, res);
        }

        // Create content route (only accessible by "docente")
        if (path === "/crear-contenido" && req.method === "GET") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            return ContentController.getCrearContenido(req, res, { isAuthenticated, userRole });
        }

        // Handle POST requests for creating content
        if (req.method === 'POST' && path === '/contents/create') {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            return ContentController.create(req, res);
        }
        // Ruta para eliminar contenido (solo accesible por "docente")
        if (path.match(/^\/contenido\/\d+$/) && req.method === "DELETE") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            const contentId = path.split('/')[2];
            await ContentController.deleteContent(req, res, { contentId });
            return;
        }

        // Show courses page
        if (path === "/cursos") {
            return await CourseController.showCourses(req, res, { isAuthenticated, userRole });
        }

        // Show specific course test
        if (path.match(/^\/curso\/\d+\/test$/)) {
            if (!isAuthenticated) {
                res.writeHead(302, { Location: "/auth/login" });
                res.end();
                return;
            }
            const courseId = path.split('/')[2];
            req.params = { id: courseId };
            await CourseController.showTest(req, res, {
                isAuthenticated,
                userRole,
                userId: userId
            });
            return;
        }

        // Show lessons for a specific course
        if (path.match(/^\/curso\/\d+\/lecciones$/) && req.method === "GET") {
            const courseId = path.split('/')[2];
            await LessonController.showLessons(req, res, { isAuthenticated, userRole, courseId });
            return;
        }

        // Handle lesson content routes
        if (path.match(/^\/leccion\/(\d+)\/contenido$/)) {
            const lessonId = path.match(/^\/leccion\/(\d+)\/contenido$/)[1];
            await ContentController.showContent(req, res, { isAuthenticated, userRole, userId, lessonId });
            return;
        }

        // Mark lesson as completed
        if (path.match(/^\/leccion\/\d+\/completar$/) && req.method === 'POST') {
            const lessonId = path.split('/')[2];
            await ContentController.markAsCompleted(req, res, { userId, lessonId });
            return;
        }

        // Edit lesson route (GET request)
        if (path.match(/^\/leccion\/\d+\/editar$/) && req.method === "GET") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }

            const lessonId = path.split('/')[2];
            await LessonController.editLesson(req, res, { isAuthenticated, userRole, lessonId });
            return;
        }

        // Update lesson route (POST request)
        // Actualizar ruta de actualización de lección para aceptar POST con override
        if (path.match(/^\/leccion\/\d+\/actualizar$/) &&
            (req.method === "PUT" ||
                (req.method === "POST" && req.headers["x-http-method-override"] === "PUT"))) {

            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: false,
                    message: "Acceso Denegado"
                }));
                return;
            }

            const lessonId = path.split('/')[2];
            await LessonController.updateLesson(req, res, { lessonId });
            return;
        }

        // Delete lesson route (only accessible by "docente")
        if (path.match(/^\/leccion\/\d+$/) && req.method === "DELETE") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            const lessonId = path.split('/')[2];
            await LessonController.deleteLesson(req, res, { lessonId });
            return;
        }

        if (req.method === 'DELETE' && req.url.match(/^\/courses\/delete\/\d+$/)) {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }

            const courseId = req.url.split('/')[3]; // Extrae el ID del curso desde la URL
            try {
                await CourseController.deleteCourse(req, res, { courseId });
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(render("course_deleted.html", { title: "Curso Eliminado" }));
            } catch (error) {
                res.writeHead(500, { "Content-Type": "text/html" });
                res.end(render("500.html", { title: "Error al Eliminar Curso" }));
            }
        }



        // Ruta para mostrar el formulario de edición
        if (path.match(/^\/curso\/\d+\/editar$/) && req.method === "GET") {
            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "text/html" });
                res.end(render("403.html", { title: "Acceso Denegado" }));
                return;
            }
            const courseId = path.split('/')[2];
            await CourseController.editCourse(req, res, { isAuthenticated, userRole, courseId });
            return;
        }

        // Ruta para procesar la actualización
        if (path.match(/^\/curso\/\d+\/actualizar$/) &&
            (req.method === "PUT" ||
                (req.method === "POST" && req.headers["x-http-method-override"] === "PUT"))) {

            if (!isAuthenticated || userRole !== "docente") {
                res.writeHead(403, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Acceso Denegado" }));
                return;
            }

            const courseId = path.split('/')[2];

            try {
                // Se pasa el objeto { courseId } a updateCourse
                await CourseController.updateCourse(req, res, { courseId });
                console.log(`Curso con ID ${courseId} guardado correctamente.`);
            } catch (error) {
                console.error(`Error guardando curso con ID ${courseId}:`, error.message);
            }
            return;
        }

        // If no route matched, return 404
        res.writeHead(302, { "Location": "/cursos" });
        res.end();
    } catch (error) {
        console.error("Error en el router:", error.message);
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error interno del servidor");
        }
    }
};

module.exports = rutas;
