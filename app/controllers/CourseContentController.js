const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const render = require('../utils/render');

/**
 * Controlador implementado para gestionar la visualización y navegación del contenido de los cursos.
 * Proporciona métodos para mostrar lecciones, gestionar el progreso del estudiante y facilitar
 * la navegación entre los diferentes componentes del curso.
 */
class CourseContentController {
    constructor() {
        this.courseModel = Course;
        this.lessonModel = Lesson;
        this.progressModel = Progress;
        this.renderUtil = render;
    }

    async showCourseContent(req, res, { isAuthenticated, userRole, userId, courseId }) {
        try {
            // Obtener información del curso
            const curso = await this.courseModel.findById(courseId);
            if (!curso) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Curso no encontrado');
                return;
            }

            // Obtener lecciones del curso
            const lecciones = await this.lessonModel.findByCourseId(courseId);

            // Obtener progreso del usuario
            const progreso = await this.progressModel.findByUserAndCourse(userId, courseId);

            // Renderizar la vista
            const html = this.renderUtil('curso-contenido.html', {
                curso: curso,
                lecciones: JSON.stringify(lecciones),
                progreso: JSON.stringify(progreso || []),
                isTeacher: userRole === 'docente'
            }, isAuthenticated, userRole);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (error) {
            console.error('Error al mostrar contenido del curso:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error interno del servidor');
        }
    }
}

module.exports = new CourseContentController();
