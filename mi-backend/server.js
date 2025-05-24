// Importaciones necesarias
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/gameRoutes');
const crearOrganizadorPorDefecto = require('./config/initOrganizador');

// Crear la instancia de Express
const app = express();

// Middleware para procesar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de CORS (¡IMPORTANTE! Cambia el origin al puerto de tu frontend)
app.use(cors({
    origin: 'refzone.netlify.app', // URL del frontend (Vite)
    credentials: true,               // Permitir envío de cookies
}));

// Configuración de sesiones
app.use(session({
    secret: 'mi-secreto',            // Cambiar en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,               // Cambiar a true en producción con HTTPS
        httpOnly: true,
        sameSite: 'lax',             // Cookies compatibles con solicitudes cruzadas
    },
}));

// Conexión a MongoDB Atlas
mongoose.connect('mongodb+srv://olired2:futbol7@cluster0.qfdl2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => {
        console.log('Conexión exitosa a MongoDB Atlas');
        crearOrganizadorPorDefecto(); // Crear organizador por defecto
    })
    .catch((error) => {
        console.error('Error al conectar a MongoDB Atlas:', error);
    });

// Rutas de API
app.use('/api/usuarios', authRoutes); // Rutas de autenticación
app.use('/api', gameRoutes);          // Rutas de partidos

// Middleware para servir archivos estáticos (opcional si usas React)
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
