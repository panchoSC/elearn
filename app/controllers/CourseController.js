const CourseService = require('../services/courseService');
const Render = require('../utils/render');
const Course = require('../models/Course');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// Agregar helper para enviar JSON
function sendJson(res, code, payload) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
}

class CourseController {

    constructor(courseService, render) {
        this.courseService = courseService;
        this.render = render;
    }

    async create(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const courseData = new URLSearchParams(body);
            const lastCourse = await Course.findLastCode();
            const nextCode = lastCourse && lastCourse.codigo ? parseInt(lastCourse.codigo) + 1 : 1;
            const codigo = nextCode.toString().padStart(6, '0');

            let course = new Course(courseData.get('codigo'), courseData.get('nombre'), courseData.get('descripcion'), courseData.get('fecha_inicio'), courseData.get('fecha_fin'), 
            courseData.get('estado'));
                // codigo,
                // nombre: courseData.get('nombre'),
                // descripcion: courseData.get('descripcion'),
                // fecha_inicio: courseData.get('fecha_inicio'),
                // fecha_fin: courseData.get('fecha_fin'),
                // estado: courseData.get('estado')
            

            await this.courseService.addCourse(course);
            this.redirect(res, '/cursos');
        } catch (error) {
            this.handleError(res, 'Error al crear curso:', error);
        }
    }

    async showCourses(req, res, { isAuthenticated, userRole }) {
        try {
            const cursos = await this.courseService.getAllCourses();
            const cursosFormatted = this.formatCourses(cursos);

            const html = this.render('cursos.html', {
                cursos: JSON.stringify(cursosFormatted),
                userRole
            }, isAuthenticated, userRole);

            this.sendResponse(res, 200, html);
        } catch (error) {
            this.handleError(res, 'Error al cargar cursos:', error);
        }
    }

    async showTest(req, res, { isAuthenticated, userRole }) {
        try {
            const courseId = parseInt(req.params.id);
            if (!courseId) {
                return this.sendErrorResponse(res, 400, 'ID de curso no proporcionado', isAuthenticated, userRole);
            }

            const course = await Course.findById(courseId);
            if (!course) {
                return this.sendErrorResponse(res, 404, 'Curso no encontrado', isAuthenticated, userRole);
            }

            const questionsWithAnswers = await this.getQuestionsWithAnswers(courseId);
            const preguntasJSON = JSON.stringify(questionsWithAnswers).replace(/'/g, "\\'").replace(/"/g, '\\"');

            const html = this.render('test-curso.html', {
                title: course.nombre,
                curso_id: course.id,
                curso_nombre: course.nombre,
                preguntas: preguntasJSON,
                isTeacher: userRole === 'docente' ? "true" : "false"
            }, isAuthenticated, userRole);

            this.sendResponse(res, 200, html);
        } catch (error) {
            this.handleError(res, 'Error al mostrar el test:', error);
        }
    }

    async editCourse(req, res, { isAuthenticated, userRole, courseId }) {
        try {
            // Validar ID del curso (debe ser un número entero positivo)
            const isValidId = Number.isInteger(Number(courseId)) && Number(courseId) > 0;
            if (!isValidId) {
                return this.sendErrorResponse(res, 400, "ID de curso inválido", isAuthenticated, userRole);
            }

            // Forzar método PUT usando cabecera X-HTTP-Method-Override
            const methodOverride = req.headers["x-http-method-override"];
            if (req.method !== "PUT" && methodOverride !== "PUT") {
                return this.sendErrorResponse(res, 405, "Método no permitido. Se requiere PUT.", isAuthenticated, userRole);
            }

            // Verificar autenticación y rol de usuario
            if (!isAuthenticated || userRole !== "admin") {
                return this.sendErrorResponse(res, 403, "Acceso Denegado", isAuthenticated, userRole);
            }

            // Buscar el curso
            const course = await Course.findById(courseId);
            if (!course) {
                return this.sendErrorResponse(res, 404, "Curso no encontrado", isAuthenticated, userRole);
            }

            // Obtener los datos del cuerpo de la solicitud
            const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body;

            // Actualizar los campos del curso
            course.nombre = nombre;
            course.descripcion = descripcion;
            course.fecha_inicio = fecha_inicio;
            course.fecha_fin = fecha_fin;
            course.estado = estado;

            // Guardar los cambios en la base de datos
            await course.save();

            // Redirigir o enviar respuesta confirmando la actualización
            this.redirect(res, '/cursos');
        } catch (error) {
            this.handleError(res, 'Error al actualizar el curso:', error);
        }
    }

    async updateCourse(req, res) {
        try {
            // Extraer el ID del curso de la URL
            const urlParts = req.url.split('/');
            const courseId = urlParts[urlParts.indexOf('curso') + 1];

            if (!courseId) {
                throw new Error('ID de curso no proporcionado');
            }

            // Obtener y parsear el body
            const body = await this.getRequestBody(req);
            const courseData = JSON.parse(body);

            console.log('Actualizando curso ID:', courseId);
            console.log('Datos a actualizar:', courseData);

            // Actualizar el curso
            const updatedCourse = await this.courseService.updateCourse(courseId, courseData);

            // Enviar respuesta
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: 'Curso actualizado correctamente',
                data: updatedCourse
            }));
        } catch (error) {
            console.error('Error al actualizar curso:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: 'Error al actualizar el curso',
                error: error.message
            }));
        }
    }

    async deleteCourse(req, res) {
        try {
            // Extraer el ID del curso desde la URL
            const urlParts = req.url.split('/');
            const courseId = urlParts[urlParts.length - 1]; // Última parte de la URL

            if (!courseId || isNaN(courseId)) {
                return this.sendErrorResponse(res, 400, 'ID de curso no válido');
            }

            // Buscar si el curso existe
            const course = await Course.findById(courseId);
            if (!course) {
                return this.sendErrorResponse(res, 404, 'Curso no encontrado');
            }

            // Eliminar el curso
            const changes = await Course.delete(courseId);

            if (changes === 0) {
                return this.sendErrorResponse(res, 404, 'No se encontró el curso para eliminar');
            }

            // Enviar respuesta de éxito en formato JSON
            sendJson(res, 200, { success: true, message: 'Curso eliminado correctamente' });

        } catch (error) {
            this.handleError(res, 'Error al eliminar el curso:', error);
        }
    }


    async deleteCourse(req, res) {
        try {
            // Extraer el ID del curso desde la URL
            const urlParts = req.url.split('/');
            const courseId = urlParts[urlParts.length - 1]; // Última parte de la URL

            if (!courseId || isNaN(courseId)) {
                return this.sendErrorResponse(res, 400, 'ID de curso no válido');
            }

            // Buscar si el curso existe
            const course = await Course.findById(courseId);
            if (!course) {
                return this.sendErrorResponse(res, 404, 'Curso no encontrado');
            }

            // Eliminar el curso
            const changes = await Course.delete(courseId);

            if (changes === 0) {
                return this.sendErrorResponse(res, 404, 'No se encontró el curso para eliminar');
            }

            // Enviar respuesta de éxito en formato JSON
            sendJson(res, 200, { success: true, message: 'Curso eliminado correctamente' });

        } catch (error) {
            this.handleError(res, 'Error al eliminar el curso:', error);
        }
    }


    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }

    async getQuestionsWithAnswers(courseId) {
        const questions = await Question.findByCourseId(courseId);
        return Promise.all(questions.map(async (question) => {
            const answers = await Answer.findByQuestionId(question.id);
            return { ...question, respuestas: answers };
        }));
    }

    formatCourses(cursos) {
        return cursos.map(curso => ({
            ...curso,
            fecha_inicio: new Date(curso.fecha_inicio).toLocaleDateString('es-ES'),
            fecha_fin: new Date(curso.fecha_fin).toLocaleDateString('es-ES'),
            created_at: new Date(curso.created_at).toLocaleDateString('es-ES')
        }));
    }

    sendResponse(res, statusCode, body) {
        res.writeHead(statusCode, { "Content-Type": "text/html" });
        res.end(body);
    }

    redirect(res, location) {
        res.writeHead(302, { Location: location });
        res.end();
    }

    sendErrorResponse(res, statusCode, message, isAuthenticated, userRole) {
        const html = this.render('500.html', { title: 'Error', message }, isAuthenticated, userRole);
        this.sendResponse(res, statusCode, html);
    }

    handleError(res, logMessage, error) {
        console.error(logMessage, error);
        this.sendResponse(res, 500, 'Error interno del servidor');
    }
}

// Crear una instancia del servicio y pasarlo al controlador
const courseServiceInstance = require('../services/courseService');
const courseController = new CourseController(courseServiceInstance, Render);
module.exports = courseController;
