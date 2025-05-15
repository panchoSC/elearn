const Usuario = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');

const updateProfile = (req, res) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        const data = new URLSearchParams(body);
        const email = data.get('email');
        const password = data.get('password');
        
        try {
            await Usuario.updateProfile(req.user.id, email, password);
            res.writeHead(302, { Location: '/perfil' });
            res.end();
        } catch (error) {
            console.error('Error updating profile:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error updating profile');
        }
    });
};

const getProfileDashboard = async (req, res) => {
    try {
        const cookies = req.headers.cookie ? require("cookie").parse(req.headers.cookie) : {};
        const email = cookies.email;

        if (!email) {
            res.writeHead(302, { Location: "/auth/login" });
            res.end();
            return;
        }

        const usuario = await new Usuario().cargarDatosUsuarioCorreo(email);
        if (!usuario) {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(render("404.html", { title: "Usuario no encontrado" }));
            return;
        }

        let dashboardData = {
            title: "Perfil",
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.correo,
            tipo_usuario: usuario.tipo_usuario,
            fecha_ingreso: new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(new Date(usuario.created_at))
        };

        if (usuario.tipo_usuario === 'docente') {
            // Get teacher specific data
            const courses = await Course.findByTeacherId(usuario.id);
            const teacherStats = await getTeacherStatistics(usuario.id);
            
            dashboardData.teacherData = JSON.stringify({
                courses: courses,
                statistics: teacherStats
            });
        } else {
            // Get student specific data
            const enrollments = await Usuario.getEnrollments(usuario.id);
            const coursesProgress = await getStudentProgress(usuario.id, enrollments);
            
            dashboardData.coursesProgress = JSON.stringify(coursesProgress);
        }

        const html = render("perfil.html", dashboardData, true);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } catch (error) {
        console.error("Error en getProfileDashboard:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error interno del servidor");
    }
};

module.exports = { updateProfile, getProfileDashboard };