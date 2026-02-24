/**
 * i18n Foundation — Simple key-value translation for KITZ.
 * Spanish-first with English fallback.
 */

const es: Record<string, string> = {
  // Common
  'loading': 'Cargando...',
  'save': 'Guardar',
  'cancel': 'Cancelar',
  'delete': 'Eliminar',
  'edit': 'Editar',
  'add': 'Agregar',
  'search': 'Buscar',
  'close': 'Cerrar',
  'confirm': 'Confirmar',
  'back': 'Volver',
  'next': 'Siguiente',
  'submit': 'Enviar',
  'create': 'Crear',
  'update': 'Actualizar',
  'done': 'Listo',

  // Errors
  'error.generic': 'Algo salio mal. Intenta de nuevo.',
  'error.network': 'Error de conexion. Verifica tu internet.',
  'error.notFound': 'No encontrado.',
  'error.unauthorized': 'No autorizado.',

  // Workspace
  'workspace.leads': 'Contactos',
  'workspace.orders': 'Pedidos',
  'workspace.tasks': 'Tareas',
  'workspace.payments': 'Pagos',
  'workspace.products': 'Productos',
  'workspace.checkout': 'Links de Pago',
  'workspace.messages': 'Mensajes',
  'workspace.calendar': 'Calendario',
  'workspace.crm': 'CRM',

  // Products
  'products.addProduct': 'Agregar Producto',
  'products.editProduct': 'Editar Producto',
  'products.name': 'Nombre',
  'products.price': 'Precio',
  'products.cost': 'Costo',
  'products.sku': 'SKU',
  'products.stock': 'Inventario',
  'products.category': 'Categoria',
  'products.lowStock': 'Stock Bajo',
  'products.outOfStock': 'Agotado',
  'products.active': 'Activos',
  'products.inactive': 'Inactivo',

  // AI
  'ai.batteryLow': 'Bateria AI baja. Recarga o usa modo manual.',
  'ai.running': 'AI procesando...',
  'ai.creditsLeft': 'Creditos restantes',
}

const en: Record<string, string> = {
  'loading': 'Loading...',
  'save': 'Save',
  'cancel': 'Cancel',
  'delete': 'Delete',
  'edit': 'Edit',
  'add': 'Add',
  'search': 'Search',
  'close': 'Close',
  'confirm': 'Confirm',
  'back': 'Back',
  'next': 'Next',
  'submit': 'Submit',
  'create': 'Create',
  'update': 'Update',
  'done': 'Done',
  'error.generic': 'Something went wrong. Try again.',
  'error.network': 'Connection error. Check your internet.',
  'error.notFound': 'Not found.',
  'error.unauthorized': 'Unauthorized.',
}

let currentLocale: 'es' | 'en' = 'es'

export function setLocale(locale: 'es' | 'en'): void {
  currentLocale = locale
}

export function getLocale(): 'es' | 'en' {
  return currentLocale
}

/** Translate a key. Returns Spanish string with English fallback. */
export function t(key: string): string {
  if (currentLocale === 'es') {
    return es[key] ?? en[key] ?? key
  }
  return en[key] ?? es[key] ?? key
}
