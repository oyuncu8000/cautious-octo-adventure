// app/page.tsx
"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Kayıt başarılı! Giriş yap.");
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.href = "/home";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-4xl font-bold gradient-text mb-4">Social App</h1>

      <input
        className="input-field"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input-field"
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex gap-4">
        <button className="btn-primary" onClick={handleRegister}>Üye Ol</button>
        <button className="btn-secondary" onClick={handleLogin}>Giriş Yap</button>
      </div>
    </div>
  );
}
