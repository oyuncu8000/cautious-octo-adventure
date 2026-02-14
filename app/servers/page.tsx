"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";

export default function ServersPage() {
  const [user, setUser] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [newServerName, setNewServerName] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) fetchServers();
  }, [user]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/");
    } else {
      setUser(data.user);
    }
  };

  const fetchServers = async () => {
    const { data, error } = await supabase
      .from("servers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setServers(data || []);
  };

  const createServer = async () => {
    if (!newServerName) return alert("Sunucu adı giriniz!");

    const inviteCode = nanoid(6);

    const { error } = await supabase.from("servers").insert({
      name: newServerName,
      owner_id: user.id,
      invite_code: inviteCode,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNewServerName("");
    fetchServers();
  };

  const getInviteLink = (inviteCode: string) => {
    return `${window.location.origin}/servers/join/${inviteCode}`;
  };

  return (
    <div className="flex flex-col items-center min-h-screen gap-6 p-4 md:p-8">
      <h1 className="text-4xl font-bold gradient-text mt-6">Sunucular</h1>

      {/* Sunucu Oluştur */}
      <div className="flex flex-col gap-2 w-full max-w-lg p-4 bg-black bg-opacity-80 rounded-lg glass">
        <input
          type="text"
          placeholder="Sunucu adı"
          value={newServerName}
          onChange={(e) => setNewServerName(e.target.value)}
          className="input-field"
        />
        <button className="btn-primary" onClick={createServer}>
          Sunucu Oluştur
        </button>
      </div>

      {/* Mevcut Sunucular */}
      <div className="flex flex-col gap-4 w-full max-w-lg mt-6">
        {servers.map((server) => (
          <div
            key={server.id}
            className="feed-card p-4 flex flex-col gap-2 cursor-pointer hover:scale-105 transition"
            onClick={() => router.push(`/servers/${server.id}`)}
          >
            <strong>{server.name}</strong>

            <span>
              Oluşturan:{" "}
              {server.owner_id === user.id ? "Sen" : server.owner_id}
            </span>

            <span
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  getInviteLink(server.invite_code)
                );
                alert("Davet linki kopyalandı!");
              }}
              className="text-blue-500 hover:underline text-sm"
            >
              Davet Linkini Kopyala
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
