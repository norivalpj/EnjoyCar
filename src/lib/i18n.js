import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  pt: {
    translation: {
      "app": {
        "name": "EnjoyCar",
        "description": "Gerencie todas as manutenções dos seus carros"
      },
      "nav": {
        "home": "Início",
        "vehicles": "Veículos",
        "history": "Histórico",
        "workshops": "Oficinas"
      },
      "settings": {
        "language": "Idioma",
        "portuguese": "Português",
        "english": "Inglês",
        "spanish": "Espanhol"
      },
      "home": {
        "title": "Manutenção de Veículos",
        "new_maintenance": "Nova Manutenção",
        "my_vehicles": "Meus Veículos",
        "history": "Histórico",
        "ai_reports": "Relatórios IA",
        "vehicles": "Veículos",
        "maintenances": "Manutenções",
        "this_month": "Este Mês",
        "total_spent": "Total Gasto",
        "services": "serviços",
        "recent_maintenances": "Últimas Manutenções",
        "see_all": "Ver todos",
        "see_history": "Ver histórico",
        "no_vehicles": "Nenhum veículo cadastrado",
        "add_vehicle": "Adicionar veículo",
        "no_maintenance": "Nenhuma manutenção registrada",
        "add_maintenance": "Adicionar manutenção",
        "workshops": "Oficinas"
      }
    }
  },
  en: {
    translation: {
      "app": {
        "name": "EnjoyCar",
        "description": "Manage all your car maintenance"
      },
      "nav": {
        "home": "Home",
        "vehicles": "Vehicles",
        "history": "History",
        "workshops": "Workshops"
      },
      "settings": {
        "language": "Language",
        "portuguese": "Portuguese",
        "english": "English",
        "spanish": "Spanish"
      },
      "home": {
        "title": "Vehicle Maintenance",
        "new_maintenance": "New Maintenance",
        "my_vehicles": "My Vehicles",
        "history": "History",
        "ai_reports": "AI Reports",
        "vehicles": "Vehicles",
        "maintenances": "Maintenances",
        "this_month": "This Month",
        "total_spent": "Total Spent",
        "services": "services",
        "recent_maintenances": "Recent Maintenances",
        "see_all": "See all",
        "see_history": "See history",
        "no_vehicles": "No vehicle registered",
        "add_vehicle": "Add vehicle",
        "no_maintenance": "No maintenance registered",
        "add_maintenance": "Add maintenance",
        "workshops": "Workshops"
      }
    }
  },
  es: {
    translation: {
      "app": {
        "name": "EnjoyCar",
        "description": "Gestiona todo el mantenimiento de tus coches"
      },
      "nav": {
        "home": "Inicio",
        "vehicles": "Vehículos",
        "history": "Historial",
        "workshops": "Talleres"
      },
      "settings": {
        "language": "Idioma",
        "portuguese": "Portugués",
        "english": "Inglés",
        "spanish": "Español"
      },
      "home": {
        "title": "Mantenimiento de Vehículos",
        "new_maintenance": "Nuevo Mantenimiento",
        "my_vehicles": "Mis Vehículos",
        "history": "Historial",
        "ai_reports": "Informes de IA",
        "vehicles": "Vehículos",
        "maintenances": "Mantenimientos",
        "this_month": "Este Mes",
        "total_spent": "Gasto Total",
        "services": "servicios",
        "recent_maintenances": "Mantenimientos Recientes",
        "see_all": "Ver todos",
        "see_history": "Ver historial",
        "no_vehicles": "Ningún vehículo registrado",
        "add_vehicle": "Añadir vehículo",
        "no_maintenance": "Ningún mantenimiento registrado",
        "add_maintenance": "Añadir mantenimiento",
        "workshops": "Talleres"
      }
    }
  }
};

const savedLanguage = localStorage.getItem('language') || 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, 
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Handle language change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
});

export default i18n;
