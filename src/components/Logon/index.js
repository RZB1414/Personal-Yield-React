import React, { useState } from "react"
import './Logon.css'
import { createUser } from "../../services/login"

const Logon = ({ onCreate }) => {
  const [form, setForm] = useState({ userName: "", email: "", password: "" })
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Faz o hash da senha antes de enviar
      const hashedPassword = await hashPassword(form.password);
      const userData = {
        userName: form.userName,
        email: form.email,
        password: hashedPassword
      };
      await createUser(userData);
      if (onCreate) onCreate(userData);
      setMessage("Usuário criado com sucesso!");
      setForm({ userName: "", email: "", password: "" });
    } catch (error) {
      setMessage("Erro ao criar usuário.");
    }
  }

  return (
    <form
     className="logon-form"
     onSubmit={handleSubmit}>
      <h2>Criar Usuário</h2>
      <input
        className="inputLogon"
        name="userName"
        placeholder="Name"
        value={form.userName}
        onChange={handleChange}
        required
      />
      <input
        className="inputLogon"
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        className="inputLogon"
        name="password"
        type="password"
        placeholder="Senha"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Criar</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default Logon;