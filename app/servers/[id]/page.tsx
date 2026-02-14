"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ServerChatPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Kullanıcı kontrolü
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
      } else {
        setUser(data.user);
      }
    };

    getUser();
  }, [router]);

  // Mesajları getir
  useEffect(() => {
    if (!serverId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("server_messages")
        .select("*")
        .eq("server_id", serverId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();
  }, [serverId]);

  // 🔥 Realtime (Supabase v2)
  useEffect(() => {
    if (!serverId) return;

    const channel = supabase
      .channel("realtime-server")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "server_messages",
        },
        (payload) => {
          if (payload.new.server_id === serverId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [serverId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from("server_messages")
      .insert({
        server_id: serverId,
        user_id: user.id,
        content: newMessage,
      });

    if (error) {
      console.error(error);
      alert("Mesaj gönderilemedi!");
      return;
    }

    setNewMessage("");
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 gap-4">
      <h1 className="text-3xl font-bold gradient-text">
        Sunucu Sohbeti
      </h1>

      {/* Mesajlar */}
      <div className="w-full max-w-2xl h-[60vh] overflow-y-auto bg-black bg-opacity-70 rounded-lg p-4 glass flex flex-col gap-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-xs ${
              msg.user_id === user?.id
                ? "bg-blue-600 text-white self-end"
                : "bg-gray-700 text-white self-start"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      {/* Mesaj Gönder */}
      <div className="flex w-full max-w-2xl gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Mesaj yaz..."
          className="input-field flex-1"
        />
        <button onClick={sendMessage} className="btn-primary">
          Gönder
        </button>
      </div>
    </div>
  );
}
