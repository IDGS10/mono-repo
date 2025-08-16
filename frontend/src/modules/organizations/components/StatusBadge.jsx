import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const StatusBadge = ({ status, type = "invitation" }) => {
  const configs = {
    invitation: {
      pending: { 
        color: 'yellow', 
        text: 'Pendiente', 
        icon: Clock,
        classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      },
      accepted: { 
        color: 'green', 
        text: 'Aceptada', 
        icon: CheckCircle,
        classes: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      },
      expired: { 
        color: 'red', 
        text: 'Expirada', 
        icon: XCircle,
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      },
      revoked: { 
        color: 'gray', 
        text: 'Revocada', 
        icon: XCircle,
        classes: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
      }
    },
    project: {
      pending: { 
        color: 'yellow', 
        text: 'Pendiente', 
        icon: Clock,
        classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      },
      approved: { 
        color: 'green', 
        text: 'Aprobado', 
        icon: CheckCircle,
        classes: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      },
      rejected: { 
        color: 'red', 
        text: 'Rechazado', 
        icon: XCircle,
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      }
    },
    organization: {
      active: { 
        color: 'green', 
        text: 'Activa', 
        icon: CheckCircle,
        classes: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      },
      inactive: { 
        color: 'red', 
        text: 'Inactiva', 
        icon: XCircle,
        classes: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      }
    }
  };

  const config = configs[type]?.[status] || {
    color: 'gray',
    text: status || 'Desconocido',
    icon: AlertCircle,
    classes: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
      <Icon size={12} />
      {config.text}
    </span>
  );
};

export default StatusBadge;