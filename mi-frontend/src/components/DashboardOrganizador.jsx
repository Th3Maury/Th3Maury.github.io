import React, { useEffect, useState } from "react";
import "../styles/dashboardOrganizador.css";

const initialGame = { name: "", date: "", time: "", location: "" };

export default function DashboardOrganizador() {
  const [games, setGames] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Agregar Partido");
  const [currentGame, setCurrentGame] = useState(initialGame);
  const [editingId, setEditingId] = useState(null);
  const [postuladosModal, setPostuladosModal] = useState({ open: false, postulados: [], gameId: null });

  const columns = 3;
  const numRows = Math.ceil(games.length / columns);
  const addGameMarginTop = (numRows - 1) * 240 + 10; // 240px de incremento por fila extra

  // Cargar partidos al montar
  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const res = await fetch("/api/games", { credentials: "include" });
      const data = await res.json();
      setGames(data);
    } catch {
      alert("Error al cargar los partidos");
    }
  }

  function openAddModal() {
    setCurrentGame(initialGame);
    setEditingId(null);
    setModalTitle("Agregar Partido");
    setModalOpen(true);
  }

  function openEditModal(game) {
    setCurrentGame({
      name: game.name,
      date: game.date ? game.date.split("T")[0] : "",
      time: game.time || "",
      location: game.location || "",
    });
    setEditingId(game._id);
    setModalTitle("Editar Partido");
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/games/${editingId}` : "/api/games";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currentGame),
      });
      const result = await res.json();
      if (res.ok) {
        setModalOpen(false);
        setEditingId(null);
        setCurrentGame(initialGame);
        loadGames();
        alert(editingId ? "Partido actualizado correctamente" : "Partido agregado correctamente");
      } else {
        alert(result.message || "Error al guardar el partido");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  async function handleDelete(gameId) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este partido?")) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        loadGames();
        alert("Partido eliminado correctamente");
      } else {
        alert("Error al eliminar el partido");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  async function openPostulados(gameId) {
    try {
      const res = await fetch(`/api/games/${gameId}/postulados`, { credentials: "include" });
      const data = await res.json();
      setPostuladosModal({ open: true, postulados: data.postulados, gameId });
    } catch {
      alert("Error al cargar postulados");
    }
  }

  async function assignArbitro(gameId, arbitroId) {
    try {
      const res = await fetch(`/api/games/${gameId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ arbitroId }),
      });
      if (res.ok) {
        setPostuladosModal({ open: false, postulados: [], gameId: null });
        loadGames();
        alert("Árbitro asignado correctamente");
      } else {
        alert("Error al asignar árbitro");
      }
    } catch {
      alert("Error al conectar con el servidor");
    }
  }

  function formatDate(date) {
    if (!date) return "";
    // Si la fecha es tipo string "YYYY-MM-DD"
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
      const [year, month, day] = date.split("T")[0].split("-");
      return `${day}/${month}/${year}`;
    }
    // Si es Date o timestamp
    const d = new Date(date);
    return d.toLocaleDateString("es-MX");
  }

  function formatTime(time) {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  }

  function logout() {
    fetch("/api/usuarios/logout", { credentials: "include" }).then(() => {
      window.location.href = "/";
    });
  }

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <header className="header">
          <div className="logo">
            <img src="/img/logo.png" alt="Logo" />
          </div>
          <div className="profile-container">
            <img className="profile-pic" src="/img/perfil1.png" alt="Perfil" />
            <div className="profile-info">
              <span className="username">Admin</span>
              <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
        </header>

        {/* Botón agregar partido */}
        <section
          className="add-game"
          style={{
            margin: `${addGameMarginTop}px 0 20px 0`,
            textAlign: "center"
          }}
        >
          <button className="add-game-btn" onClick={openAddModal}>Agregar Partido</button>
        </section>

        {/* Lista de partidos */}
        <h1 style={{
          textAlign: "center",
          margin: "0 0 20px 0",
          fontWeight: "bold",
          fontSize: "2.5rem",
          letterSpacing: "2px",
          textShadow: "2px 2px 6px #00000044"
        }}>
          LISTA DE PARTIDOS
        </h1>
        <section className="games-list" id="gamesList">
          {games.length === 0 && <p>No hay partidos registrados.</p>}
          {games.map((game) => (
            <div className="game-card" key={game._id}>
              <button className="delete-btn" onClick={() => handleDelete(game._id)}>Eliminar</button>
              <button className="edit-btn" onClick={() => openEditModal(game)}>Editar</button>
              <div className="game-title">{game.name}</div>
              <div className="game-date-time">
                <span>{formatDate(game.date)} {formatTime(game.time)}</span>
              </div>
              <div className="game-location">{game.location}</div>
              <div className="game-arbitro">
                Árbitro: {game.arbitro ? (game.arbitro.nombre || game.arbitro.email) : "Sin asignar"}
              </div>
              {!game.arbitro && (
                <button className="postulados-btn" onClick={() => openPostulados(game._id)}>
                  Ver postulados
                </button>
              )}
            </div>
          ))}
        </section>

        {/* Modal agregar/editar partido */}
        {modalOpen && (
          <div className="modal" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-btn" onClick={() => setModalOpen(false)}>&times;</span>
              <h2>{modalTitle}</h2>
              <form onSubmit={handleSave}>
                <input
                  type="text"
                  placeholder="Nombre del partido"
                  value={currentGame.name}
                  onChange={e => setCurrentGame({ ...currentGame, name: e.target.value })}
                  required
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                  type="date"
                  value={currentGame.date}
                  onChange={e => setCurrentGame({ ...currentGame, date: e.target.value })}
                  required
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                  type="time"
                  value={currentGame.time}
                  onChange={e => setCurrentGame({ ...currentGame, time: e.target.value })}
                  required
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                  type="text"
                  placeholder="Ubicación"
                  value={currentGame.location}
                  onChange={e => setCurrentGame({ ...currentGame, location: e.target.value })}
                  required
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <button className="confirm-btn" type="submit">
                  {editingId ? "Guardar cambios" : "Agregar"}
                </button>
                <button className="cancel-btn" type="button" onClick={() => setModalOpen(false)} style={{ marginLeft: 10 }}>
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal de postulados */}
        {postuladosModal.open && (
          <div className="modal" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <span className="close-btn" onClick={() => setPostuladosModal({ open: false, postulados: [], gameId: null })}>&times;</span>
              <h2>Postulados</h2>
              {postuladosModal.postulados.length === 0 ? (
                <p>No hay postulados para este partido.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {postuladosModal.postulados.map(arbitro => (
                    <div
                      key={arbitro._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                        padding: "4px 0"
                      }}
                    >
                      <span>{arbitro.nombre || arbitro.email}</span>
                      <button
                        className="mini-assign-btn"
                        onClick={() => assignArbitro(postuladosModal.gameId, arbitro._id)}
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          <div className="contact-info">
            <strong>Contacto:</strong><br />
            Teléfono: +52 312 100 1096<br />
            Email: contacto@refzone.com<br />
            Redes Sociales:
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"> Facebook </a>|
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"> Instagram </a>|
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"> Twitter </a>
          </div>
        </footer>
      </div>
    </div>
  );
}