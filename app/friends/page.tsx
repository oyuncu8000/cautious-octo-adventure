"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FriendsPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) window.location.href = "/";
    else setUser(data.user);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) return console.error(error);
    setUsers(data || []);
  };

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const handleAddFriend = async (friendId: string) => {
    await supabase.from("friends").insert({ user_id: user.id, friend_id: friendId });
    alert("Arkadaş eklendi!");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-3xl font-bold gradient-text mt-4">Arkadaşlar</h1>
      <div className="flex flex-col gap-3 w-full max-w-md">
        {users
          .filter((u) => u.id !== user?.id)
          .map((u) => (
            <div key={u.id} className="flex items-center justify-between p-2 feed-card">
              <div className="flex items-center gap-3">
                <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                <span>{u.username}</span>
              </div>
              <button className="btn-primary text-sm" onClick={() => handleAddFriend(u.id)}>
                Ekle
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
