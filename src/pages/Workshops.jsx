import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Wrench, Star } from "lucide-react";

import WorkshopForm from '../components/forms/WorkshopForm';
import WorkshopCard from '../components/workshops/WorkshopCard';

export default function Workshops() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [deletingWorkshop, setDeletingWorkshop] = useState(null);

  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => base44.entities.Workshop.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Workshop.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setIsFormOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Workshop.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setEditingWorkshop(null);
      setIsFormOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Workshop.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setDeletingWorkshop(null);
    }
  });

  const handleSubmit = (data) => {
    if (editingWorkshop) {
      updateMutation.mutate({ id: editingWorkshop.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWorkshop(null);
  };

  const favoriteWorkshops = workshops.filter(w => w.is_favorite);
  const otherWorkshops = workshops.filter(w => !w.is_favorite);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 flex-1 h-full">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Oficinas Mecânicas</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Gerencie suas oficinas de confiança
              </p>
            </div>
          </div>
          
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Oficina
          </Button>
        </div>

        {/* Workshops List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : workshops.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Nenhuma oficina cadastrada
              </h2>
              <p className="text-slate-500 mb-6">
                Cadastre suas oficinas de confiança para receber sugestões de agendamento
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Oficina
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Favorites */}
            {favoriteWorkshops.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Favoritas
                </h2>
                <div className="space-y-3">
                  {favoriteWorkshops.map(workshop => (
                    <WorkshopCard 
                      key={workshop.id}
                      workshop={workshop}
                      onEdit={handleEdit}
                      onDelete={setDeletingWorkshop}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Others */}
            {otherWorkshops.length > 0 && (
              <div>
                {favoriteWorkshops.length > 0 && (
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">
                    Outras Oficinas
                  </h2>
                )}
                <div className="space-y-3">
                  {otherWorkshops.map(workshop => (
                    <WorkshopCard 
                      key={workshop.id}
                      workshop={workshop}
                      onEdit={handleEdit}
                      onDelete={setDeletingWorkshop}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWorkshop ? 'Editar Oficina' : 'Nova Oficina'}
              </DialogTitle>
            </DialogHeader>
            <WorkshopForm 
              initialData={editingWorkshop || {}}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deletingWorkshop} onOpenChange={() => setDeletingWorkshop(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir oficina?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir {deletingWorkshop?.name}? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deletingWorkshop.id)}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}