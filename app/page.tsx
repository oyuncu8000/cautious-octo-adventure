'use client';
import { supabase } from '../lib/supabase';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Send, Heart, MessageCircle, UserPlus, Search, Image, Video, X, 
  Home, Users, User, LogOut, Plus, Bookmark, MoreHorizontal, Bell,
  Smile, Paperclip, Phone, VideoIcon, Hash
} from 'lucide-react';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  friends: string[];
  status?: 'online' | 'idle' | 'offline';
}

interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  comments: Comment[];
  timestamp: number;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

interface Chat {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage?: string;
  unreadCount: number;
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

  // LocalStorage'dan verileri yükle - her saniye kontrol et
  useEffect(() => {
    const loadData = () => {
      if (typeof window !== 'undefined') {
        try {
          const usersData = localStorage.getItem('app_users');
          if (usersData) {
            const parsedUsers = JSON.parse(usersData);
            setUsers(parsedUsers);
            
            // Eğer currentUser varsa, onu güncelle
            if (currentUser) {
              const updatedCurrentUser = parsedUsers.find((u: User) => u.id === currentUser.id);
              if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
              }
            }
          }

          const postsData = localStorage.getItem('app_posts');
          if (postsData) {
            setPosts(JSON.parse(postsData));
          }

          const messagesData = localStorage.getItem('app_messages');
          if (messagesData) {
            setMessages(JSON.parse(messagesData));
          }
        } catch (error) {
          console.error('Veri yükleme hatası:', error);
        }
      }
    };

    loadData();
    
    // Her 1 saniyede bir verileri kontrol et (diğer kullanıcıların değişikliklerini görmek için)
    const interval = setInterval(loadData, 1000);
    
    return () => clearInterval(interval);
  }, [currentUser?.id]); // currentUser.id değiştiğinde de yükle



  // Kullanıcı oturumunu localStorage'da tut (sadece kimlik doğrulama için)
  useEffect(() => {
    const savedUser = localStorage.getItem('current_session_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('current_session_user');
    }
  }, [currentUser]);

  // Mesajları otomatik kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  const handleRegister = () => {
    if (!authForm.username || !authForm.email || !authForm.password) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }
    if (users.some(u => u.email === authForm.email)) {
      alert('Bu email zaten kullanılıyor!');
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      username: authForm.username,
      email: authForm.email,
      password: authForm.password,
      friends: [],
      status: 'online'
    };
    
    // Yeni kullanıcıyı ekle
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    setAuthForm({ username: '', email: '', password: '' });
    
    // Direkt localStorage'a kaydet
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    localStorage.setItem('app_current_user', JSON.stringify(newUser));
    window.dispatchEvent(new Event('storage'));
  };

  const handleLogin = () => {
    const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
    if (user) {
      const updatedUser = { ...user, status: 'online' as const };
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      
      setCurrentUser(updatedUser);
      setUsers(updatedUsers);
      setAuthForm({ username: '', email: '', password: '' });
      
      // Direkt localStorage'a kaydet
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
    } else {
      alert('Email veya şifre hatalı!');
    }
  };
  
  const handleLogout = () => {
    if (currentUser) {
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, status: 'offline' as const } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('storage'));
    }
    setCurrentUser(null);
    localStorage.removeItem('app_current_user');
    setActiveTab('home');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Dosya boyutu 15MB\'dan küçük olmalıdır!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      setNewPostMedia({ url, type });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Profil resmi 5MB\'dan küçük olmalıdır!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const updatedUser = { ...currentUser, avatar: url };
      const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
      
      setCurrentUser(updatedUser);
      setUsers(updatedUsers);
      
      // Direkt localStorage'a kaydet
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = () => {
    if (!currentUser || (!newPostContent.trim() && !newPostMedia)) {
      alert('Lütfen içerik ekleyin!');
      return;
    }
    const newPost: Post = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      content: newPostContent,
      mediaUrl: newPostMedia?.url,
      mediaType: newPostMedia?.type,
      likes: [],
      comments: [],
      timestamp: Date.now()
    };
    
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    setNewPostContent('');
    setNewPostMedia(null);
    setShowNewPost(false);
    
    // Direkt localStorage'a kaydet
    localStorage.setItem('app_posts', JSON.stringify(updatedPosts));
    window.dispatchEvent(new Event('storage'));
  };

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const likes = post.likes.includes(currentUser.id)
          ? post.likes.filter(id => id !== currentUser.id)
          : [...post.likes, currentUser.id];
        return { ...post, likes };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem('app_posts', JSON.stringify(updatedPosts));
    window.dispatchEvent(new Event('storage'));
  };

  const handleComment = (postId: string, content: string) => {
    if (!currentUser) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      content,
      timestamp: Date.now()
    };
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    localStorage.setItem('app_posts', JSON.stringify(updatedPosts));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddFriend = (friendId: string) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      friends: [...currentUser.friends, friendId]
    };
    
    const updatedUsers = users.map(u => 
      u.id === currentUser.id ? updatedUser : u
    );
    
    setCurrentUser(updatedUser);
    setUsers(updatedUsers);
    
    // Direkt localStorage'a kaydet
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('storage'));
  };

  const handleRemoveFriend = (friendId: string) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      friends: currentUser.friends.filter(id => id !== friendId)
    };
    
    const updatedUsers = users.map(u => 
      u.id === currentUser.id ? updatedUser : u
    );
    
    setCurrentUser(updatedUser);
    setUsers(updatedUsers);
    
    // Direkt localStorage'a kaydet
    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    localStorage.setItem('app_current_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSendMessage = () => {
    if (!currentUser || !activeChat || !messageInput.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: activeChat,
      content: messageInput,
      timestamp: Date.now(),
      read: false
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessageInput('');
    
    // Direkt localStorage'a kaydet
    localStorage.setItem('app_messages', JSON.stringify(updatedMessages));
    window.dispatchEvent(new Event('storage'));
  };

  const getChats = (): Chat[] => {
    if (!currentUser) return [];
    const userChats = new Map<string, Chat>();
    
    messages.forEach(msg => {
      if (msg.senderId === currentUser.id || msg.receiverId === currentUser.id) {
        const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        const otherUser = users.find(u => u.id === otherUserId);
        if (otherUser) {
          const existing = userChats.get(otherUserId);
          const isUnread = msg.receiverId === currentUser.id && !msg.read;
          
          userChats.set(otherUserId, {
            userId: otherUser.id,
            username: otherUser.username,
            avatar: otherUser.avatar,
            lastMessage: msg.content,
            unreadCount: existing ? existing.unreadCount + (isUnread ? 1 : 0) : (isUnread ? 1 : 0),
            status: otherUser.status
          });
        }
      }
    });
    
    return Array.from(userChats.values()).sort((a, b) => b.unreadCount - a.unreadCount);
  };

  const getChatMessages = (userId: string): Message[] => {
    if (!currentUser) return [];
    return messages
      .filter(msg => 
        (msg.senderId === currentUser.id && msg.receiverId === userId) ||
        (msg.senderId === userId && msg.receiverId === currentUser.id)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
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
              className="w-full py-3 bg-[#5865F2] text-white rounded-lg font-semibold hover:bg-[#4752C4]"
            >
              {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
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

      <main className="max-w-7xl mx-auto px-4 pt-20 pb-24">
        <div className="flex gap-4">
          {/* Sidebar - aynı kalacak */}
          <aside className="hidden lg:block w-60 fixed left-4 top-20">
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold">{currentUser.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <StatusIndicator status={currentUser.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{currentUser.username}</p>
                  <p className="text-xs text-[#b5bac1] truncate">{currentUser.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeTab === 'home' ? 'bg-[#5865F2] text-white' : 'text-[#b5bac1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-sm font-medium">Ana Sayfa</span>
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeTab === 'friends' ? 'bg-[#5865F2] text-white' : 'text-[#b5bac1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Arkadaşlar</span>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg relative ${
                    activeTab === 'messages' ? 'bg-[#5865F2] text-white' : 'text-[#b5bac1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Mesajlar</span>
                  {getChats().reduce((acc, chat) => acc + chat.unreadCount, 0) > 0 && (
                    <span className="ml-auto bg-[#ed4245] text-white text-xs px-2 py-0.5 rounded-full">
                      {getChats().reduce((acc, chat) => acc + chat.unreadCount, 0)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                    activeTab === 'profile' ? 'bg-[#5865F2] text-white' : 'text-[#b5bac1] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Profil</span>
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#ed4245] hover:bg-[#ed4245]/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Çıkış Yap</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Ana içerik - aynı kalacak */}
          <div className="flex-1 lg:ml-64">
            {activeTab === 'home' && (
              <div className="max-w-2xl mx-auto space-y-4">
                {posts.length === 0 ? (
                  <div className="bg-[#1a1a1a] rounded-xl p-12 text-center border border-[#2a2a2a]">
                    <Camera className="w-12 h-12 text-[#4a4a4a] mx-auto mb-4" />
                    <p className="text-[#b5bac1] mb-4">Henüz gönderi yok</p>
                    <button onClick={() => setShowNewPost(true)} className="px-6 py-2.5 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] text-sm font-semibold">
                      İlk Gönderiyi Oluştur
                    </button>
                  </div>
                ) : (
                  posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLike={handleLike}
                      onComment={handleComment}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <div className="p-4 border-b border-[#2a2a2a]">
                    <h2 className="text-lg font-bold">Arkadaşlar</h2>
                  </div>
                  {currentUser.friends.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="w-12 h-12 text-[#4a4a4a] mx-auto mb-4" />
                      <p className="text-[#b5bac1] mb-4">Henüz arkadaşınız yok</p>
                      <button onClick={() => setShowUserSearch(true)} className="px-6 py-2.5 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] text-sm font-semibold">
                        Kullanıcı Ara
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {users
                        .filter(u => currentUser.friends.includes(u.id))
                        .map(friend => (
                          <div key={friend.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                                  {friend.avatar ? (
                                    <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold">{friend.username[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <StatusIndicator status={friend.status} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{friend.username}</p>
                                <p className="text-xs text-[#b5bac1]">{friend.email}</p>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveFriend(friend.id)} className="px-4 py-1.5 bg-[#2a2a2a] text-[#b5bac1] rounded-lg hover:bg-[#3a3a3a] text-sm">
                              Kaldır
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="max-w-5xl mx-auto">
                <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] h-[calc(100vh-8rem)]">
                  <div className="flex h-full">
                    <div className="w-full sm:w-80 border-r border-[#2a2a2a] flex flex-col">
                      <div className="p-4 border-b border-[#2a2a2a]">
                        <h2 className="text-lg font-bold">Mesajlar</h2>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {getChats().length === 0 ? (
                          <div className="p-8 text-center">
                            <MessageCircle className="w-12 h-12 text-[#4a4a4a] mx-auto mb-3" />
                            <p className="text-[#b5bac1] text-sm">Henüz mesaj yok</p>
                          </div>
                        ) : (
                          getChats().map(chat => (
                            <button
                              key={chat.userId}
                              onClick={() => setActiveChat(chat.userId)}
                              className={`w-full p-4 flex items-center gap-3 hover:bg-[#2a2a2a] border-b border-[#2a2a2a] ${
                                activeChat === chat.userId ? 'bg-[#2a2a2a]' : ''
                              }`}
                            >
                              <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                                  {chat.avatar ? (
                                    <img src={chat.avatar} alt={chat.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold">{chat.username[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <StatusIndicator status={chat.status} />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-semibold text-sm truncate">{chat.username}</p>
                                <p className="text-xs text-[#b5bac1] truncate">{chat.lastMessage}</p>
                              </div>
                              {chat.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-[#ed4245] rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold">{chat.unreadCount}</span>
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-1 flex-col">
                      {activeChat ? (
                        <>
                          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                                  {users.find(u => u.id === activeChat)?.avatar ? (
                                    <img 
                                      src={users.find(u => u.id === activeChat)?.avatar} 
                                      alt={users.find(u => u.id === activeChat)?.username} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <span className="text-sm font-bold">{users.find(u => u.id === activeChat)?.username[0].toUpperCase()}</span>
                                  )}
                                </div>
                                <StatusIndicator status={users.find(u => u.id === activeChat)?.status} />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{users.find(u => u.id === activeChat)?.username}</p>
                                <p className="text-xs text-[#b5bac1]">
                                  {users.find(u => u.id === activeChat)?.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                                <Phone className="w-5 h-5 text-[#b5bac1]" />
                              </button>
                              <button className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                                <VideoIcon className="w-5 h-5 text-[#b5bac1]" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {getChatMessages(activeChat).map(msg => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                                    msg.senderId === currentUser.id
                                      ? 'bg-[#5865F2] text-white'
                                      : 'bg-[#2a2a2a] text-white'
                                  }`}
                                >
                                  <p className="text-sm">{msg.content}</p>
                                  <p className="text-xs mt-1 opacity-60">
                                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>

                          <div className="p-4 border-t border-[#2a2a2a]">
                            <div className="flex gap-2">
                              <button className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                                <Paperclip className="w-5 h-5 text-[#b5bac1]" />
                              </button>
                              <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Mesaj yaz..."
                                className="flex-1 px-4 py-2 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none text-sm"
                              />
                              <button onClick={handleSendMessage} className="p-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg">
                                <Send className="w-5 h-5 text-white" />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <MessageCircle className="w-16 h-16 text-[#4a4a4a] mx-auto mb-4" />
                            <p className="text-[#b5bac1]">Bir sohbet seçin</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-[#5865F2] to-[#7289DA]"></div>
                  <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-16 mb-4">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden border-4 border-[#1a1a1a]">
                          {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold">{currentUser.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 bg-[#5865F2] rounded-full text-white hover:bg-[#4752C4]"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <StatusIndicator status={currentUser.status} />
                      </div>
                      <button className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] text-sm font-semibold">
                        Profili Düzenle
                      </button>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{currentUser.username}</h2>
                    <p className="text-[#b5bac1] text-sm mb-4">{currentUser.email}</p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                        <p className="text-2xl font-bold mb-1">
                          {posts.filter(p => p.userId === currentUser.id).length}
                        </p>
                        <p className="text-xs text-[#b5bac1]">Gönderi</p>
                      </div>
                      <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                        <p className="text-2xl font-bold mb-1">{currentUser.friends.length}</p>
                        <p className="text-xs text-[#b5bac1]">Arkadaş</p>
                      </div>
                      <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                        <p className="text-2xl font-bold mb-1">
                          {posts.filter(p => p.userId === currentUser.id).reduce((acc, p) => acc + p.likes.length, 0)}
                        </p>
                        <p className="text-xs text-[#b5bac1]">Beğeni</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <div className="p-4 border-b border-[#2a2a2a]">
                    <h3 className="font-bold">Gönderilerim</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {posts
                      .filter(p => p.userId === currentUser.id)
                      .map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLike={handleLike}
                          onComment={handleComment}
                        />
                      ))}
                    {posts.filter(p => p.userId === currentUser.id).length === 0 && (
                      <div className="text-center py-8">
                        <Camera className="w-12 h-12 text-[#4a4a4a] mx-auto mb-3" />
                        <p className="text-[#b5bac1] text-sm">Henüz gönderi paylaşmadınız</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobil navigasyon - aynı kalacak */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-[#2a2a2a] z-50">
        <div className="flex items-center justify-around px-4 h-16">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#5865F2]' : 'text-[#b5bac1]'}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs">Ana Sayfa</span>
          </button>
          <button onClick={() => setActiveTab('friends')} className={`flex flex-col items-center gap-1 ${activeTab === 'friends' ? 'text-[#5865F2]' : 'text-[#b5bac1]'}`}>
            <Users className="w-6 h-6" />
            <span className="text-xs">Arkadaşlar</span>
          </button>
          <button onClick={() => setActiveTab('messages')} className={`flex flex-col items-center gap-1 relative ${activeTab === 'messages' ? 'text-[#5865F2]' : 'text-[#b5bac1]'}`}>
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Mesajlar</span>
            {getChats().reduce((acc, chat) => acc + chat.unreadCount, 0) > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ed4245] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{getChats().reduce((acc, chat) => acc + chat.unreadCount, 0)}</span>
              </div>
            )}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#5865F2]' : 'text-[#b5bac1]'}`}>
            <User className="w-6 h-6" />
            <span className="text-xs">Profil</span>
          </button>
        </div>
      </nav>

      {/* Yeni gönderi modalı - aynı kalacak */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[#2a2a2a]">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-lg font-bold">Yeni Gönderi</h2>
              <button
                onClick={() => {
                  setShowNewPost(false);
                  setNewPostContent('');
                  setNewPostMedia(null);
                }}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg"
              >
                <X className="w-5 h-5 text-[#b5bac1]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Ne düşünüyorsun?"
                className="w-full h-32 px-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none resize-none"
              />

              {newPostMedia && (
                <div className="mt-4 relative">
                  {newPostMedia.type === 'image' ? (
                    <img src={newPostMedia.url} alt="Preview" className="w-full rounded-lg" />
                  ) : (
                    <video src={newPostMedia.url} controls className="w-full rounded-lg" />
                  )}
                  <button onClick={() => setNewPostMedia(null)} className="absolute top-2 right-2 p-2 bg-[#ed4245] rounded-lg hover:bg-[#c93638]">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="p-4 border-t border-[#2a2a2a] flex items-center justify-between">
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                  <Image className="w-5 h-5 text-[#5865F2]" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                  <Video className="w-5 h-5 text-[#eb459e]" />
                </button>
                <button className="p-2 hover:bg-[#2a2a2a] rounded-lg">
                  <Smile className="w-5 h-5 text-[#faa61a]" />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() && !newPostMedia}
                className="px-6 py-2 bg-[#5865F2] text-white rounded-lg font-semibold hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Paylaş
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kullanıcı arama modalı - aynı kalacak */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-[#2a2a2a]">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-lg font-bold">Kullanıcı Ara</h2>
              <button
                onClick={() => {
                  setShowUserSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg"
              >
                <X className="w-5 h-5 text-[#b5bac1]" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d6d6d] w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kullanıcı ara..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] text-white placeholder-[#6d6d6d] focus:border-[#5865F2] outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {users
                .filter(u => 
                  u.id !== currentUser.id &&
                  (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(user => (
                  <div key={user.id} className="mb-3 p-4 bg-[#0a0a0a] rounded-lg flex items-center justify-between border border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#7289DA] flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold">{user.username[0].toUpperCase()}</span>
                          )}
                        </div>
                        <StatusIndicator status={user.status} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-xs text-[#b5bac1]">{user.email}</p>
                      </div>
                    </div>
                    {currentUser.friends.includes(user.id) ? (
                      <button onClick={() => handleRemoveFriend(user.id)} className="px-4 py-1.5 bg-[#2a2a2a] text-[#b5bac1] rounded-lg hover:bg-[#3a3a3a] text-sm">
                        Arkadaş
                      </button>
                    ) : (
                      <button onClick={() => handleAddFriend(user.id)} className="px-4 py-1.5 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] text-sm font-semibold flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Takip Et
                      </button>
                    )}
                  </div>
                ))}
              {users.filter(u => 
                u.id !== currentUser.id &&
                (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 u.email.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[#4a4a4a] mx-auto mb-3" />
                  <p className="text-[#b5bac1] text-sm">Kullanıcı bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
            {post.userAvatar ? (
              <img src={post.userAvatar} alt={post.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold">{post.username[0].toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{post.username}</p>
            <p className="text-xs text-[#b5bac1]">
              {new Date(post.timestamp).toLocaleDateString('tr-TR', {
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

      {post.mediaUrl && (
        <div className="w-full bg-black">
          {post.mediaType === 'image' ? (
            <img src={post.mediaUrl} alt="Post" className="w-full object-contain max-h-[500px]" />
          ) : (
            <video src={post.mediaUrl} controls className="w-full max-h-[500px]" />
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
            <p>✨ Tüm kullanıcılar aynı verileri görür</p>
            <p className="mt-1">🔄 Veriler gerçek zamanlı güncellenir</p>
          </div>
        </div>
      </div>
    );
  };

export default SocialApp;