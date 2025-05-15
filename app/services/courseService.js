const Course = require('../models/Course');

const courseService = {
    addCourse: async (courseData) => {
        try {
            const courseId = await courseData.guardarCursoBD();
            return courseId;
        } catch (error) {
            throw error;
        }
    },

    getAllCourses: async () => {
        try {
            let courses = await new Course().listarTodosLosCursos();
            return courses;
            
        } catch (error) {
            throw error;
        }
    },

    // Método actualizado para actualizar curso en la base de datos
    updateCourse: async (courseId, courseData) => {
        try {
            // Obtenemos el curso por ID
            const course = await Course.findById(parseInt(courseId));
            if (!course) {
                throw new Error('Curso no encontrado');
            }

            // En lugar de usar course.save(), implementamos la actualización directamente
            await Course.update(courseId, courseData);
            
            // Obtenemos los datos actualizados del curso para devolverlos
            const updatedCourse = await Course.findById(parseInt(courseId));
            return updatedCourse;
        } catch (error) {
            console.error('Error en updateCourse:', error);
            throw error;
        }
    },

    // Nuevo método para buscar curso por ID
    findById: async (courseId) => {
        try {
            return await Course.findById(courseId);
        } catch (error) {
            throw error;
        }
    }
};

module.exports = courseService;