// app/components/BottomNav.tsx
"use client";
import React from "react";

interface BottomNavProps {
  current: string;
  onNavigate: (page: string) => void;
}

export default function BottomNav({ current, onNavigate }: BottomNavProps) {
  return (
    <div className="bottom-nav safe-area-bottom">
      {[
        { name: "Home", icon: "🏠" },
        { name: "Sunucular", icon: "🌐" },
        { name: "Arkadaşlar", icon: "👥" },
        { name: "Profil", icon: "👤" },
      ].map((item) => (
        <button
          key={item.name}
          className={`flex flex-col items-center justify-center text-sm ${
            current === item.name ? "text-white" : "text-secondary"
          }`}
          onClick={() => onNavigate(item.name)}
        >
          <span>{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}
