import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

export default function FeedbackDialog({ open, onClose, user }) {
  const [type, setType] = useState('sugestao');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    const typeLabel = { sugestao: 'Sugestão', bug: 'Bug', feedback: 'Feedback' }[type];
    await base44.integrations.Core.SendEmail({
      to: 'norivalpj@gmail.com',
      subject: `[EnjoyCar] ${typeLabel} de ${user?.full_name || user?.email}`,
      body: `Tipo: ${typeLabel}\nUsuário: ${user?.full_name || ''} (${user?.email})\n\n${message}`
    });
    setLoading(false);
    setSent(true);
  };

  const handleClose = () => {
    setSent(false);
    setMessage('');
    setType('sugestao');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar feedback</DialogTitle>
          <DialogDescription>
            Sua mensagem será enviada diretamente ao desenvolvedor.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="font-semibold text-slate-800">Obrigado pelo feedback!</p>
            <p className="text-sm text-slate-500">Sua mensagem foi enviada com sucesso.</p>
            <Button onClick={handleClose} className="mt-2">Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sugestao">💡 Sugestão de funcionalidade</SelectItem>
                  <SelectItem value="bug">🐛 Reportar um bug</SelectItem>
                  <SelectItem value="feedback">💬 Feedback geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Descreva sua sugestão, bug ou feedback..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleSend} disabled={!message.trim() || loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}