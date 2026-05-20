import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, MessageSquarePlus } from "lucide-react";
import FeedbackDialog from './FeedbackDialog';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] || '?').toUpperCase();

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full hover:bg-slate-100 px-2 py-1 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium text-slate-700 max-w-32 truncate">
            {user.name || user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium text-sm">{user.name || 'Usuário'}</p>
          <p className="text-xs text-slate-500 font-normal truncate">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={createPageUrl('NotificationSettings')} className="cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setFeedbackOpen(true)}>
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Enviar feedback
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={() => logout(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} user={user} />
    </>
  );
}