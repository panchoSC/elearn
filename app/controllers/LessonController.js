const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const Content = require("../models/Content");
const render = require("../utils/render");

class LessonController {
    constructor(lessonModel, courseModel, contentModel) {
        this.Lesson = lessonModel;
        this.Course = courseModel;
        this.Content = contentModel;
    }

    async create(req, res) {
        let body = "";
        req.on("data", chunk => (body += chunk.toString()));

        req.on("end", async () => {
            try {
                const formData = new URLSearchParams(body);
                const course_id = parseInt(formData.get("course_id"));

                if (!course_id) {
                    return this.sendError(res, 400, "ID del curso inválido");
                }

                const course = await this.Course.findById(course_id);
                if (!course) {
                    return this.sendError(res, 404, "Curso no encontrado");
                }

                const lessonData = {
                    course_id: course_id,
                    titulo: formData.get("titulo"),
                    descripcion: formData.get("descripcion"),
                    orden: parseInt(formData.get("orden")) || 1,
                    estado: formData.get("estado") || "borrador"
                };

                let lesson = new Lesson(lessonData.get('course_id'), lessonData.get('titulo'), lessonData.get('descripcion'), lessonData.get('orden'));
                await lesson.guardarLessonBD();
                //await this.Lesson.create(lessonData);

                // Redirigir al formulario para crear otra lección
                res.writeHead(302, { Location: `/curso/${lesson.getCourseId()}/crear-leccion` });
                res.end();
            } catch (error) {
                this.sendError(res, 500, "Error al crear la lección", error);
            }
        });
    }

    getCrearLeccion(req, res, { isAuthenticated, userRole }) {
        const html = render("crear-leccion.html", { title: "Crear Lección" }, isAuthenticated, userRole);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    }

    async showLessons(req, res, { isAuthenticated, userRole, courseId }) {
        try {
            const numericCourseId = parseInt(courseId);
            if (!numericCourseId) return this.sendError(res, 400, "ID del curso inválido");

            const course = await this.Course.findById(numericCourseId);
            if (!course) return this.sendError(res, 404, "Curso no encontrado");

            const lessons = await this.Lesson.findByCourseId(numericCourseId);
            const data = {
                curso_id: numericCourseId,
                curso_nombre: course.nombre,
                lecciones: JSON.stringify(lessons || []),
                isTeacher: userRole === "docente" ? "true" : "false"
            };

            const html = render("lecciones.html", data, isAuthenticated, userRole);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            this.sendError(res, 500, "Error al mostrar lecciones: " + errorMessage);
        }
    }

    async editLesson(req, res, { isAuthenticated, userRole, lessonId }) {
        try {
            // Validar ID de la lección para SQLite3 (debe ser un número entero positivo)
            const isValidId = Number.isInteger(Number(lessonId)) && Number(lessonId) > 0;
            if (!isValidId) {
                return this.sendError(res, 400, "ID de lección inválido");
            }


            // Forzar método PUT usando cabecera X-HTTP-Method-Override
            const methodOverride = req.headers["x-http-method-override"];
            if (req.method !== "PUT" && methodOverride !== "PUT") {
                return this.sendError(res, 405, "Método no permitido. Se requiere PUT.");
            }

            // Verificar autenticación y rol de usuario
            if (!isAuthenticated || userRole !== "docente") {
                return this.sendError(res, 403, "Acceso Denegado");
            }

            // Buscar la lección
            const lesson = await this.Lesson.findById(lessonId);
            if (!lesson) {
                return this.sendError(res, 404, "Lección no encontrada");
            }

            // Buscar el curso asociado a la lección
            const course = await this.Course.findById(lesson.course_id);
            if (!course) {
                return this.sendError(res, 404, "Curso no encontrado");
            }

            // Obtener contenidos de la lección
            const contenidos = await this.Content.findByLessonId(lessonId);
            const nextOrden = contenidos.length ? Math.max(...contenidos.map(c => c.orden)) + 1 : 1;

            // Renderizar la vista de editar lección
            const html = render("editar-leccion.html", {
                title: "Editar Lección",
                curso: course,
                leccion: lesson,
                contenidos: contenidos,
                nextOrden: nextOrden
            });

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        } catch (error) {
            console.error("Error al editar lección:", error);
            this.sendError(res, 500, "Error interno del servidor");
        }
    }

    async updateLesson(req, res, { lessonId }) {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            
            req.on('end', async () => {
                try {
                    // Parsear el body como JSON
                    const data = JSON.parse(body);
                    
                    // Validar datos requeridos
                    if (!data.titulo || !data.descripcion || !data.orden) {
                        return this.sendJson(res, 400, {
                            success: false,
                            message: 'Faltan campos requeridos'
                        });
                    }

                    const lessonData = {
                        titulo: data.titulo,
                        descripcion: data.descripcion,
                        orden: parseInt(data.orden),
                        course_id: parseInt(data.course_id)
                    };

                    // Actualizar la lección
                    await this.Lesson.update(lessonId, lessonData);
                    
                    // Obtener la lección actualizada
                    const updatedLesson = await this.Lesson.findById(lessonId);
                    
                    this.sendJson(res, 200, {
                        success: true,
                        message: 'Lección actualizada correctamente',
                        lesson: updatedLesson
                    });
                } catch (error) {
                    console.error('Error al procesar datos:', error);
                    this.sendJson(res, 400, {
                        success: false,
                        message: 'Error al procesar los datos'
                    });
                }
            });
        } catch (error) {
            console.error('Error al actualizar lección:', error);
            this.sendJson(res, 500, {
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Método para destruir (eliminar) la lección
    async deleteLesson(req, res, { lessonId }) {
        try {
            const lesson = await this.Lesson.findById(lessonId);
            if (!lesson) {
                return this.sendJson(res, 404, { error: "Lección no encontrada" });
            }

            // Eliminar los contenidos relacionados antes de eliminar la lección
            await this.Content.deleteByLessonId(lessonId);
            await this.Lesson.delete(lessonId);  // Eliminar la lección

            this.sendJson(res, 200, { message: "Lección eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar la lección:", error);
            this.sendJson(res, 500, { error: "Error al eliminar la lección" });
        }
    }


    /** Métodos auxiliares para responder las peticiones */
    sendError(res, statusCode, message) {
        console.error(`Error ${statusCode}: ${message}`);
        res.writeHead(statusCode, { "Content-Type": "text/plain" });
        res.end(message);
    }

    sendJson(res, statusCode, data) {
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    }

    redirect(res, url) {
        res.writeHead(302, { Location: url });
        res.end();
    }
}

// Exportar una instancia de la clase con las dependencias inyectadas
module.exports = new LessonController(Lesson, Course, Content);
