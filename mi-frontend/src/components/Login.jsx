import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await response.json();
      alert(data.message);
      if (response.status === 200) {
        if (data.redirect && data.redirect.includes("organizador")) {
          navigate("/dashboard-organizador");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error(error); // Ahora sí usas la variable
      alert("Error al iniciar sesión");
    }
  };

  return (
    <div className="page-container">
      <div className="content-area">
        <div className="login-box">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="textbox">
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="textbox">
              <input
                type="password"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Entrar
              </button>
            </div>
          </form>
          <p className="login-link">
            ¿No tienes cuenta? <a href="/register">Regístrate</a>
          </p>
          <p className="login-link">
            ¿Olvidaste tu contraseña? <a href="/recuperar">Recupérala</a>
          </p>
        </div>
      </div>
    </div>
  );
}