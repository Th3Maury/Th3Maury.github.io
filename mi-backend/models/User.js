// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'arbitro' },
    nombre: { type: String, required: true },
    edad: { type: Number, required: true },
    contacto: { type: String, required: true },
    experiencia: { type: String, required: true }
});

// Método para comparar la contraseña en el inicio de sesión
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar el token JWT
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, role: this.role }, 'tu_clave_secreta', { expiresIn: '1h' });
    return token;
};

// Encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    // Verificar si la contraseña ya está encriptada
    if (this.password.startsWith('$2b$')) {
        console.log('Contraseña ya está encriptada. No se volverá a encriptar.');
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Contraseña encriptada:', this.password); // Log para depuración
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;