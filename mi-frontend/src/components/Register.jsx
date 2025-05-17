import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nombre: "",
    edad: "",
    contacto: "",
    experiencia: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/usuarios/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      alert(data.message);
      if (response.status === 201) {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert("Error al registrar");
    }
  };

  return (
    <div className="page-container">
      <div className="content-area">
        <div className="register-box">
          <h2>Registrar Árbitro</h2>
          <form id="registerForm" onSubmit={handleSubmit}>
            <div className="textbox">
              <input
                type="email"
                id="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="textbox">
              <input
                type="password"
                id="password"
                placeholder="Contraseña"
                required
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <div className="textbox">
              <input
                type="text"
                id="nombre"
                placeholder="Nombre"
                required
                value={form.nombre}
                onChange={handleChange}
              />
            </div>
            <div className="textbox">
              <input
                type="number"
                id="edad"
                placeholder="Edad"
                required
                value={form.edad}
                onChange={handleChange}
              />
            </div>
            <div className="textbox">
              <input
                type="text"
                id="contacto"
                placeholder="Contacto"
                required
                value={form.contacto}
                onChange={handleChange}
              />
            </div>
            <div className="textbox">
              <input
                type="text"
                id="experiencia"
                placeholder="Experiencia arbitrando"
                required
                value={form.experiencia}
                onChange={handleChange}
              />
            </div>
            <button type="submit">Registrar</button>
          </form>
          <p className="login-link">
            ¿Ya tienes una cuenta? <a href="/">Iniciar sesión</a>
          </p>
        </div>
      </div>
    </div>
  );
}