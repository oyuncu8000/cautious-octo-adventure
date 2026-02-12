'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Send, Heart, MessageCircle, UserPlus, Search, Image, Video, X, 
  Home, Users, User, LogOut, Plus, Bookmark, MoreHorizontal, Bell,
  Smile, Paperclip, Phone, VideoIcon, Hash
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  friends: string[];
  status?: 'online' | 'idle' | 'offline';
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Chat {
  user_id: string;
  username: string;
  avatar?: string;
  last_message?: string;
  unread_count: number;
  status?: 'online' | 'idle' | 'offline';
}

const SocialApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'friends' | 'messages' | 'profile'>('home');
  const [showNewPost, setShowNewPost] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gerçek zamanlı veri akışı için subscription
  useEffect(() => {
    if (!currentUser) return;

    // Kullanıcılar kanalı
    const usersChannel = supabase
      .channel('users-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('Users change:', payload);
          fetchUsers();
        }
      )
      .subscribe();

    // Gönderiler kanalı
    const postsChannel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Posts change:', payload);
          fetchPosts();
        }
      )
      .subscribe();

    // Mesajlar kanalı
    const messagesChannel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Messages change:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUser]);

  // Oturum kontrolü
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setCurrentUser(userData);
        }
      }
    };
    
    checkUser();
  }, []);

  // Verileri çekme fonksiyonları
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Yorumları ve beğenileri de çek
      const postsWithDetails = await Promise.all(
        data.map(async (post) => {
          const { data: comments } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });
          
          return {
            ...post,
            comments: comments || [],
            likes: post.likes || []
          };
        })
      );
      setPosts(postsWithDetails);
    }
  };

  const fetchMessages = async () => {
    if (!currentUser) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMessages(data);
    }
  };

  // Kullanıcı kaydı
  const handleRegister = async () => {
    if (!authForm.username || !authForm.email || !authForm.password) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setIsLoading(true);
    
    try {
      // Supabase Auth ile kullanıcı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Kullanıcı tablosuna ekle
        const newUser: User = {
          id: authData.user.id,
          username: authForm.username,
          email: authForm.email,
          friends: [],
          status: 'online',
          created_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('users')
          .insert([newUser]);

        if (dbError) throw dbError;

        setCurrentUser(newUser);
        setAuthForm({ username: '', email: '', password: '' });
        await fetchUsers();
        await fetchPosts();
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt olurken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  // Giriş yapma
  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      alert('Lütfen email ve şifrenizi girin!');
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userError) throw userError;

        // Kullanıcıyı online yap
        const { error: updateError } = await supabase
          .from('users')
          .update({ status: 'online' })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;

        setCurrentUser(userData);
        setAuthForm({ username: '', email: '', password: '' });
        await fetchUsers();
        await fetchPosts();
        await fetchMessages();
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      alert('Email veya şifre hatalı!');
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış yapma
  const handleLogout = async () => {
    if (currentUser) {
      await supabase
        .from('users')
        .update({ status: 'offline' })
        .eq('id', currentUser.id);
    }

    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveTab('home');
  };

  // Avatar yükleme
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Profil resmi 5MB\'dan küçük olmalıdır!');
      return;
    }

    setIsLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Storage'a yükle
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Kullanıcıyı güncelle
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      const updatedUser = { ...currentUser, avatar: publicUrl };
      setCurrentUser(updatedUser);
      await fetchUsers();
    } catch (error) {
      console.error('Avatar yükleme hatası:', error);
      alert('Avatar yüklenirken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  // Gönderi oluşturma
  const handleCreatePost = async () => {
    if (!currentUser || (!newPostContent.trim() && !newPostMedia)) {
      alert('Lütfen içerik ekleyin!');
      return;
    }

    setIsLoading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      // Medya varsa yükle
      if (newPostMedia) {
        const file = await fetch(newPostMedia.url).then(r => r.blob());
        const fileExt = file.type.split('/')[1];
        const fileName = `post-${currentUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
        mediaType = newPostMedia.type;
      }

      // Gönderiyi kaydet
      const newPost = {
        user_id: currentUser.id,
        username: currentUser.username,
        user_avatar: currentUser.avatar,
        content: newPostContent,
        media_url: mediaUrl,
        media_type: mediaType,
        likes: [],
        created_at: new Date().toISOString()
      };

      const { error: postError } = await supabase
        .from('posts')
        .insert([newPost]);

      if (postError) throw postError;

      setNewPostContent('');
      setNewPostMedia(null);
      setShowNewPost(false);
      await fetchPosts();
    } catch (error) {
      console.error('Gönderi oluşturma hatası:', error);
      alert('Gönderi oluşturulurken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  // Beğeni işlemi
  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      let updatedLikes;
      if (post.likes.includes(currentUser.id)) {
        updatedLikes = post.likes.filter(id => id !== currentUser.id);
      } else {
        updatedLikes = [...post.likes, currentUser.id];
      }

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('id', postId);

      if (error) throw error;

      await fetchPosts();
    } catch (error) {
      console.error('Beğeni hatası:', error);
    }
  };

  // Yorum ekleme
  const handleComment = async (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;

    try {
      const newComment = {
        post_id: postId,
        user_id: currentUser.id,
        username: currentUser.username,
        content,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('comments')
        .insert([newComment]);

      if (error) throw error;

      await fetchPosts();
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
    }
  };

  // Arkadaş ekleme
  const handleAddFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const updatedFriends = [...currentUser.friends, friendId];
      
      const { error } = await supabase
        .from('users')
        .update({ friends: updatedFriends })
        .eq('id', currentUser.id);

      if (error) throw error;

      const updatedUser = { ...currentUser, friends: updatedFriends };
      setCurrentUser(updatedUser);
      await fetchUsers();
    } catch (error) {
      console.error('Arkadaş ekleme hatası:', error);
    }
  };

  // Arkadaş çıkarma
  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const updatedFriends = currentUser.friends.filter(id => id !== friendId);
      
      const { error } = await supabase
        .from('users')
        .update({ friends: updatedFriends })
        .eq('id', currentUser.id);

      if (error) throw error;

      const updatedUser = { ...currentUser, friends: updatedFriends };
      setCurrentUser(updatedUser);
      await fetchUsers();
    } catch (error) {
      console.error('Arkadaş çıkarma hatası:', error);
    }
  };

  // Mesaj gönderme
  const handleSendMessage = async () => {
    if (!currentUser || !activeChat || !messageInput.trim()) return;

    try {
      const newMessage = {
        sender_id: currentUser.id,
        receiver_id: activeChat,
        content: messageInput,
        read: false,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .insert([newMessage]);

      if (error) throw error;

      setMessageInput('');
      await fetchMessages();
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  const getChats = (): Chat[] => {
    if (!currentUser) return [];
    const userChats = new Map<string, Chat>();
    
    messages.forEach(msg => {
      if (msg.sender_id === currentUser.id || msg.receiver_id === currentUser.id) {
        const otherUserId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const otherUser = users.find(u => u.id === otherUserId);
        if (otherUser) {
          const existing = userChats.get(otherUserId);
          const isUnread = msg.receiver_id === currentUser.id && !msg.read;
          
          userChats.set(otherUserId, {
            user_id: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar,
            last_message: msg.content,
            unread_count: existing ? existing.unread_count + (isUnread ? 1 : 0) : (isUnread ? 1 : 0),
            status: otherUser.status
          });
        }
      }
    });
    
    return Array.from(userChats.values()).sort((a, b) => b.unread_count - a.unread_count);
  };

  const getChatMessages = (userId: string): Message[] => {
    if (!currentUser) return [];
    return messages
      .filter(msg => 
        (msg.sender_id === currentUser.id && msg.receiver_id === userId) ||
        (msg.sender_id === userId && msg.receiver_id === currentUser.id)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const StatusIndicator = ({ status }: { status?: 'online' | 'idle' | 'offline' }) => {
    const colors = {
      online: 'bg-green-500',
      idle: 'bg-yellow-500',
      offline: 'bg-gray-500'
    };
    return (
      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a1a] ${colors[status || 'offline']}`} />
    );
  };

  // Aynı UI kodu...
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-md border border-[#2a2a2a]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#5865F2] to-[#7289DA] rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz</h1>
            <p className="text-[#b5bac1] text-sm">Topluluğa katılın</p>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">Kullanıcı Adı</label>
                <input
                  type="text"
                  placeholder="kullaniciadi"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">Email</label>
              <input
                type="email"
                placeholder="isim@example.com"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#b5bac1] text-xs font-semibold mb-2 uppercase">Şifre</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none"
              />
            </div>

            <button
              onClick={isLogin ? handleLogin : handleRegister}
              disabled={isLoading}
              className="w-full py-3 bg-[#5865F2] text-white rounded-lg font-semibold hover:bg-[#4752C4] disabled:opacity-50"
            >
              {isLoading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
            </button>

            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-[#00b0f4] hover:underline text-sm"
            >
              {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header - aynı kalacak */}
      <header className="fixed top-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#2a2a2a] z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#5865F2] to-[#7289DA] rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold hidden sm:block">Social</h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewPost(true)} className="p-2 hover:bg-[#2a2a2a] rounded-lg">
              <Plus className="w-5 h-5 text-[#b5bac1]" />
            </button>
            <button onClick={() => setShowUserSearch(true)} className="p-2 hover:bg-[#2a2a2a] rounded-lg">
              <Search className="w-5 h-5 text-[#b5bac1]" />
            </button>
            <button className="p-2 hover:bg-[#2a2a2a] rounded-lg relative">
              <Bell className="w-5 h-5 text-[#b5bac1]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ed4245] rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Geri kalan UI kodu aynen devam ediyor */}
      {/* ... (PostCard bileşeni dahil) ... */}
    </div>
  );
};

const PostCard: React.FC<{
  post: Post;
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
}> = ({ post, currentUser, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const handleAddComment = () => {
    if (commentInput.trim()) {
      onComment(post.id, commentInput);
      setCommentInput('');
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
            {post.user_avatar ? (
              <img src={post.user_avatar} alt={post.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold">{post.username[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{post.username}</p>
            <p className="text-xs text-[#b5bac1]">
              {new Date(post.created_at).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-[#2a2a2a] rounded-lg">
          <MoreHorizontal className="w-5 h-5 text-[#b5bac1]" />
        </button>
      </div>

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-white text-sm">{post.content}</p>
        </div>
      )}

      {post.media_url && (
        <div className="w-full bg-black">
          {post.media_type === 'image' ? (
            <img src={post.media_url} alt="Post" className="w-full object-contain max-h-[500px]" />
          ) : (
            <video src={post.media_url} controls className="w-full max-h-[500px]" />
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 ${
                post.likes.includes(currentUser.id) ? 'text-[#ed4245]' : 'text-[#b5bac1] hover:text-white'
              }`}
            >
              <Heart className={`w-6 h-6 ${post.likes.includes(currentUser.id) ? 'fill-current' : ''}`} />
              {post.likes.length > 0 && <span className="text-sm font-semibold">{post.likes.length}</span>}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="text-[#b5bac1] hover:text-white flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              {post.comments.length > 0 && <span className="text-sm font-semibold">{post.comments.length}</span>}
            </button>
          </div>
          <button className="text-[#b5bac1] hover:text-[#faa61a]">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>

        {showComments && (
          <div className="space-y-3 pt-3 border-t border-[#2a2a2a]">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex gap-2">
                <div className="flex-1 bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
                  <p className="text-sm">
                    <span className="font-semibold text-[#5865F2]">{comment.username}</span>
                    <span className="text-white ml-2">{comment.content}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Yorum ekle..."
            className="flex-1 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none text-sm"
          />
          <button onClick={handleAddComment} className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] text-sm font-semibold">
            Gönder
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[#6d6d6d]">
          <p>🌍 Tüm kullanıcılar aynı verileri görür</p>
          <p className="mt-1">🔄 Veriler gerçek zamanlı güncellenir</p>
        </div>
      </div>
    </div>
  );
};

export default SocialApp;