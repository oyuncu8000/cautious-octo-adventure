"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BottomNav from "../components/BottomNav"; // Alt menü bileşeni
import ProfilePage from "../account/page";
import FriendsPage from "../friends/page";
import ServersPage from "../servers/page";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState("Home"); // Alt menü için

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && currentPage === "Home") fetchPosts();
  }, [user, currentPage]);

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

  // Sayfa render fonksiyonu
  const renderPage = () => {
    switch (currentPage) {
      case "Home":
        return (
          <div className="flex flex-col items-center min-h-screen gap-6 p-4 md:p-8">
            <h1 className="text-4xl font-bold gradient-text mt-6">Ana Sayfa</h1>

            {/* Post Form */}
            <div className="flex flex-col gap-3 w-full max-w-lg bg-black bg-opacity-80 p-4 rounded-lg glass">
              <textarea
                placeholder="Ne düşünüyorsun?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field resize-none"
              />
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input-field"
              />
              <button className="btn-primary" onClick={handleUpload}>
                Paylaş
              </button>
            </div>

            {/* Feed */}
            <div className="flex flex-col gap-4 w-full max-w-lg mt-6">
              {posts.map((post) => (
                <div key={post.id} className="feed-card p-4">
                  <p>{post.content}</p>

                  {post.media_url && post.media_type?.startsWith("image") && (
                    <img
                      src={post.media_url}
                      className="w-full mt-2 rounded-md"
                    />
                  )}

                  {post.media_url && post.media_type?.startsWith("video") && (
                    <video
                      src={post.media_url}
                      controls
                      className="w-full mt-2 rounded-md"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "Profil":
        return <ProfilePage />;

      case "Arkadaşlar":
        return <FriendsPage />;

      case "Sunucular":
        return <ServersPage />;

      default:
        return <div>Sayfa bulunamadı</div>;
    }
  };

  return (
    <div className="relative min-h-screen">
      {renderPage()}

      {/* Alt menü */}
      <BottomNav current={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}
