const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

// Ruta para registrarse
router.post('/registro', async (req, res) => {
    const { email, password, nombre, edad, contacto, experiencia } = req.body;

    try {
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const newUser = new User({
            email,
            password, // No encriptes aquí, deja que el middleware lo haga
            role: 'arbitro',
            nombre,
            edad,
            contacto,
            experiencia
        });

        await newUser.save();
        res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Comparar la contraseña encriptada con la proporcionada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }
        const token = user.generateAuthToken();
        // Guardar el userId en la sesión
        req.session.userId = user._id;

        // Redirigir según el rol
        const redirect = user.role === 'organizador'
            ? '/dashboard_organizador.html'
            : '/dashboard.html';

        res.status(200).json({ message: 'Inicio de sesión exitoso', redirect });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

router.get('/check-session', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId); // Busca el usuario en la base de datos
            if (user) {
                return res.status(200).json({
                    message: 'Sesión activa',
                    userId: user._id,
                    nombre: user.nombre // Incluye el nombre del usuario en la respuesta
                });
            }
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return res.status(500).json({ message: 'Error del servidor' });
        }
    }
    return res.status(401).json({ message: 'Usuario no autenticado' });
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.status(200).json({ message: 'Sesión cerrada con éxito' });
    });
});

// Ruta para obtener el perfil del usuario
router.get('/perfil/:email', async (req, res) => {
    const { email } = req.params;

    try {
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            nombre: user.nombre,
            edad: user.edad,
            contacto: user.contacto,
            experiencia: user.experiencia
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});
// Ruta para recuperar contraseña
router.post('/recuperar', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Generar un token único para la recuperación
        const token = user.generateAuthToken(); // Puedes usar tu método existente o crear un token único
        const recoveryLink = `http://localhost:5173/resetear?token=${token}`;

        // Configurar el transporte de correo
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Cambia esto si usas otro servicio
            auth: {
                user: 'maurymendoza021@gmail.com', // Tu email
                pass: 'wofm lgcl vkne epgl',      // Tu contraseña (o un token de aplicación)
            },
        });

        // Enviar correo con el enlace de recuperación
        await transporter.sendMail({
            from: '"Soporte Refzone" <maurymendoza021@gmail.com>',
            to: email,
            subject: 'Recuperación de Contraseña',
            text: `Hola ${user.nombre}, sigue este enlace para recuperar tu contraseña: ${recoveryLink}`,
            html: `<p>Hola ${user.nombre},</p><p>Sigue este enlace para recuperar tu contraseña:</p><a href="${recoveryLink}">${recoveryLink}</a>`,
        });

        res.status(200).json({ message: 'Correo de recuperación enviado con éxito' });
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error);
        res.status(500).json({ message: 'Error al enviar el correo de recuperación' });
    }
});
router.post('/resetear', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Decodificar el token
        const decoded = jwt.verify(token, 'tu_clave_secreta'); // Cambia 'tu_clave_secreta' por una clave real o variable de entorno

        // Buscar al usuario por ID
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar la contraseña del usuario
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
});
module.exports = router;
