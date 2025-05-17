const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const mongoose = require('mongoose');



// Ruta para agregar un partido
router.post('/games', async (req, res) => {
    const { name, date, time, location } = req.body;

    try {
        const newGame = new Game({ name, date, time, location });
        await newGame.save();  // Guardar el nuevo partido en MongoDB
        res.status(201).json(newGame); // Devuelve el partido agregado como respuesta
    } catch (error) {
        console.error('Error al agregar el partido:', error);
        res.status(500).json({ message: 'Error al agregar el partido' });
    }
});
router.get('/games', async (req, res) => {
    const now = new Date();

    try {
        // Eliminar partidos que ya pasaron
        await Game.deleteMany({ 
            $or: [
                { date: { $lt: now.toISOString().split('T')[0] } }, // Fecha pasada
                { 
                    date: { $eq: now.toISOString().split('T')[0] }, 
                    time: { $lt: now.toTimeString().split(' ')[0] } // Hora pasada
                }
            ]
        });

        // Obtener la lista actualizada de partidos, incluyendo los datos del árbitro
        const games = await Game.find({})
            .populate('arbitro', 'nombre email') // Poblamos el campo árbitro
            .sort({ date: 1, time: 1 }); // Ordenados por fecha y hora

        res.status(200).json(games);
    } catch (error) {
        console.error('Error al obtener partidos:', error);
        res.status(500).json({ message: 'Error al obtener partidos', error });
    }
});


// Eliminar un partido por ID
router.delete('/games/:id', async (req, res) => {
    try {
        const gameId = req.params.id;

        // Validar que el ID sea un ObjectId válido
        if (!gameId || !gameId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'ID inválido.' });
        }

        const deletedGame = await Game.findByIdAndDelete(gameId);

        if (!deletedGame) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        res.status(200).json({ message: 'Partido eliminado correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el partido.' });
    }
});


router.post('/games/:id/apply', async (req, res) => {
    const { id } = req.params;
  
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }
  
    // Validar que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID de partido inválido' });
    }
  
    try {
        const game = await Game.findById(id);
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado' });
        }
  
        // Verifica si el usuario ya está postulado
        if (game.postulados.includes(req.session.userId)) {
            return res.status(400).json({ message: 'Ya estás postulado para este partido' });
        }
  
        // Verifica si ya se alcanzó el límite de 5 postulados
        if (game.postulados.length >= 5) {
            return res.status(400).json({ message: 'El límite de postulantes ha sido alcanzado' });
        }
  
        // Agrega el usuario a la lista de postulados
        game.postulados.push(req.session.userId);
        await game.save();
  
        res.status(200).json({ message: 'Postulación exitosa' });
    } catch (error) {
        console.error('Error al postularse:', error);
        res.status(500).json({ message: 'Error al postularse' });
    }
  });


// Ruta para postularse como árbitro


// Asignar árbitro al partido y devolver con datos completos
router.post('/games/:id/assign', async (req, res) => {
    try {
        const { arbitroId } = req.body;

        if (!arbitroId) {
            return res.status(400).json({ message: 'ID del árbitro no proporcionado.' });
        }

        // Encuentra y actualiza el partido
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        // Verifica si el árbitro está en la lista de postulados (si aplica)
        if (game.postulados && !game.postulados.includes(arbitroId)) {
            return res.status(400).json({ message: 'El árbitro seleccionado no está postulado.' });
        }

        // Asignar árbitro y limpiar postulados
        game.arbitro = arbitroId;
        game.postulados = [];
        await game.save();

        // Poblamos el árbitro antes de responder
        const updatedGame = await Game.findById(req.params.id).populate('arbitro', 'nombre email');
        res.status(200).json({ message: 'Árbitro asignado correctamente', game: updatedGame });
    } catch (error) {
        console.error('Error al asignar árbitro:', error);
        res.status(500).json({ message: 'Error al asignar árbitro' });
    }
});


// Obtener postulados de un partido
router.get('/games/:id/postulados', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('postulados', 'nombre email _id');
        if (!game) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }
        res.status(200).json({ postulados: game.postulados });
    } catch (error) {
        console.error('Error al obtener postulados:', error);
        res.status(500).json({ message: 'Error al obtener postulados.' });
    }
});

// Ruta para cancelar postulación
router.post('/games/cancel-postulation', async (req, res) => {
    const { gameId, userId } = req.body;

    console.log('Datos recibidos del cliente:', { gameId, userId });

    if (!gameId || !userId) {
        return res.status(400).json({ message: 'Datos incompletos: gameId y userId son requeridos.' });
    }

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            console.log('Partido no encontrado en la base de datos.');
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }

        console.log('Partido encontrado:', game);

        const index = game.postulados.indexOf(userId);
        if (index === -1) {
            console.log('Usuario no está postulado para este partido.');
            return res.status(400).json({ message: 'No estás postulado para este partido.' });
        }

        // Elimina al usuario de la lista de postulados
        game.postulados.splice(index, 1);
        await game.save();

        console.log('Postulación cancelada con éxito. Partido actualizado:', game);

        res.json({ message: 'Postulación cancelada con éxito.' });
    } catch (error) {
        console.error('Error al cancelar postulación:', error);
        res.status(500).json({ message: 'Error interno al cancelar la postulación.' });
    }
});
router.put('/games/:id', async (req, res) => {
    const { name, date, time, location } = req.body;
    const gameId = req.params.id;

    try {
        const updatedGame = await Game.findByIdAndUpdate(gameId, { name, date, time, location }, { new: true });
        if (!updatedGame) {
            return res.status(404).json({ message: 'Partido no encontrado.' });
        }
        res.status(200).json({ updatedGame });
    } catch (error) {
        console.error('Error al actualizar el partido:', error);
        res.status(500).json({ message: 'Error al actualizar el partido' });
    }
});



module.exports = router;