"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) window.location.href = "/";
    else setUser(data.user);
  };

  const handleAvatarUpload = async () => {
    if (!user || !avatar) return;

    const { data: uploadData, error } = await supabase.storage
      .from("avatars")
      .upload(`${user.id}-${Date.now()}-${avatar.name}`, avatar, { upsert: true });

    if (error) return alert(error.message);

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadData.path);

    alert("Profil resmi güncellendi!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-3xl font-bold gradient-text mt-4">Profil</h1>
      <input
        type="text"
        placeholder="Kullanıcı adı"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="input-field w-full max-w-xs"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files?.[0] || null)}
        className="input-field w-full max-w-xs"
      />
      <button className="btn-primary" onClick={handleAvatarUpload}>
        Profil Resmi Güncelle
      </button>
      <button className="btn-secondary" onClick={handleLogout}>
        Oturumu Kapat
      </button>
    </div>
  );
}
