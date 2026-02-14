"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      window.location.href = "/";
    } else {
      setUser(data.user);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPosts(data || []);
  };

  const handleUpload = async () => {
    if (!user) return;

    let mediaUrl = null;
    let mediaType = null;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Dosya en fazla 10MB olabilir!");
        return;
      }

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("media")
          .upload(`${Date.now()}-${file.name}`, file);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("media")
        .getPublicUrl(uploadData.path);

      mediaUrl = publicUrlData.publicUrl;
      mediaType = file.type;
    }

    const { error: insertError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content || "",
        media_url: mediaUrl,
        media_type: mediaType,
      });

    if (insertError) {
      alert(insertError.message);
      console.error(insertError);
      return;
    }

    setContent("");
    setFile(null);
    fetchPosts();
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: "auto" }}>
      <h1>Ana Sayfa</h1>

      <textarea
        placeholder="Ne düşünüyorsun?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginBottom: 10 }}
      />

      <button
        onClick={handleUpload}
        style={{
          padding: 10,
          backgroundColor: "black",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Paylaş
      </button>

      <hr style={{ margin: "20px 0" }} />

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            marginBottom: 15,
          }}
        >
          <p>{post.content}</p>

          {post.media_url &&
            post.media_type?.startsWith("image") && (
              <img
                src={post.media_url}
                style={{ width: "100%", marginTop: 10 }}
              />
            )}

          {post.media_url &&
            post.media_type?.startsWith("video") && (
              <video
                src={post.media_url}
                controls
                style={{ width: "100%", marginTop: 10 }}
              />
            )}
        </div>
      ))}
    </div>
  );
}
