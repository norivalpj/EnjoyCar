import EditMaintenance from './pages/EditMaintenance';
import NotificationSettings from './pages/NotificationSettings';
import History from './pages/History';
import Home from './pages/Home';
import MaintenanceDetail from './pages/MaintenanceDetail';
import MaintenancePlan from './pages/MaintenancePlan';
import NewMaintenance from './pages/NewMaintenance';
import Reports from './pages/Reports';
import VehicleDetail from './pages/VehicleDetail';
import Vehicles from './pages/Vehicles';
import Workshops from './pages/Workshops';
import __Layout from './Layout.jsx';


export const PAGES = {
    "EditMaintenance": EditMaintenance,
    "History": History,
    "Home": Home,
    "MaintenanceDetail": MaintenanceDetail,
    "MaintenancePlan": MaintenancePlan,
    "NewMaintenance": NewMaintenance,
    "Reports": Reports,
    "VehicleDetail": VehicleDetail,
    "Vehicles": Vehicles,
    "Workshops": Workshops,
    "NotificationSettings": NotificationSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};