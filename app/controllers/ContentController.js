const Content = require('../models/Content');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const render = require('../utils/render');

/**
 * Controlador diseñado para gestionar el contenido específico dentro de las lecciones.
 * Incluye funcionalidad para crear, mostrar y editar contenidos, así como
 * registrar el progreso de los usuarios al completar el material de estudio.
 */
class ContentController {
    /**
     * Método implementado para crear nuevos contenidos dentro de una lección.
     * Procesa los datos del formulario y almacena el nuevo contenido en la base de datos.
     */
    async create(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());

        req.on('end', async () => {
            try {
                const formData = new URLSearchParams(body);
                if (!formData.get('lesson_id') || !formData.get('titulo') || !formData.get('contenido')) {
                    return res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Faltan datos requeridos');
                }
                let content = new Content(titulo=formData.get('titulo'), contenido=formData.get('contenido'), lesson_id=formData.get('lesson_id'));
                await content.guardarContentBD();
                // Crear el contenido en la base de datos
                //await Content.create({ lesson_id, titulo, contenido, orden });
                
                // Redirigir al listado de contenidos de la lección
                res.writeHead(302, { Location: `/leccion/${content.getLessonId()}/contenido` }).end();
            } catch (error) {
                console.error('Error al crear contenido:', error);
                res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Error interno del servidor');
            }
        });
    }

    /**
     * Función para presentar el contenido de una lección específica.
     * Incluye navegación entre lecciones y seguimiento del progreso del estudiante.
     */
    async showContent(req, res, { isAuthenticated, userRole, userId, lessonId }) {
        try {
            if (!lessonId) {
                return res.writeHead(400, { 'Content-Type': 'text/plain' }).end('ID de lección no proporcionado');
            }

            console.log(`Buscando lección con ID: ${lessonId}`);  // Imprime la llamada para la lección
            const lesson = await Lesson.findById(lessonId);
            if (!lesson) {
                return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Lección no encontrada');
            }

            console.log(`Buscando curso con ID: ${lesson.course_id}`);  // Imprime la llamada para el curso
            const course = await Course.findById(lesson.course_id);
            if (!course) {
                return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Curso no encontrado');
            }

            console.log(`Buscando contenidos de la lección con ID: ${lessonId}`);  // Imprime la llamada para los contenidos
            const contenidos = await Content.findByLessonId(lessonId) || [];

            console.log(`Buscando todas las lecciones del curso con ID: ${lesson.course_id}`);  // Imprime la llamada para las lecciones
            const allLessons = await Lesson.findByCourseId(lesson.course_id);

            const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
            const leccionAnterior = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
            const leccionSiguiente = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

            let progress = null;
            if (userId && userRole !== 'docente') {
                console.log(`Buscando progreso del usuario ${userId} en la lección ${lessonId}`);  // Imprime la llamada para el progreso
                progress = await Progress.findByUserAndLesson(userId, lessonId) || await Progress.create(userId, lessonId);
                await Progress.updateLastAccessed(userId, lessonId);
            }

            const html = render('contenido.html', {
                title: lesson.titulo,
                leccion: JSON.stringify(lesson),
                curso: course,
                contenidos: JSON.stringify(contenidos),
                leccionAnterior: JSON.stringify(leccionAnterior),
                leccionSiguiente: JSON.stringify(leccionSiguiente),
                isCompleted: progress ? progress.completed : false,
                isTeacher: userRole === 'docente'
            }, isAuthenticated, userRole);

            res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
        } catch (error) {
            console.error('Error al mostrar contenido:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Error interno del servidor');
        }
    }


    /**
     * Método desarrollado para actualizar el estado de progreso cuando un estudiante
     * completa una unidad de contenido.
     */
    async markAsCompleted(req, res, { userId, lessonId }) {
        try {
            if (!lessonId || !userId) {
                return res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Parámetros faltantes' }));
            }

            await Progress.markAsCompleted(userId, lessonId);
            res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: true }));
        } catch (error) {
            console.error('Error al marcar como completado:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Error interno del servidor');
        }
    }

    // Mostrar formularios de creación y edición de contenido
    async getCrearContenido(req, res, { isAuthenticated, userRole }) {
        const html = render('crear-contenido.html', { title: 'Crear Contenido' }, isAuthenticated, userRole);
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
    }

    async getEditarContenido(req, res, { isAuthenticated, userRole, contentId }) {
        try {
            if (!contentId) {
                return res.writeHead(400, { 'Content-Type': 'text/plain' }).end('ID de contenido no proporcionado');
            }

            const content = await Content.findById(contentId);
            if (!content) {
                return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Contenido no encontrado');
            }

            const lesson = await Lesson.findById(content.lesson_id);
            if (!lesson) {
                return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Lección no encontrada');
            }

            const html = render('editar-contenido.html', {
                title: 'Editar Contenido',
                content: JSON.stringify(content),
                lesson: JSON.stringify(lesson)
            }, isAuthenticated, userRole);

            res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
        } catch (error) {
            console.error('Error al obtener contenido para editar:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Error interno del servidor');
        }
    }
}

module.exports = new ContentController();
