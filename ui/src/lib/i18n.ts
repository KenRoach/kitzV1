/**
 * i18n Foundation — Simple key-value translation for KITZ.
 * Supports English, Spanish, and Portuguese.
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
  'workspace.leads': 'Leads',
  'workspace.orders': 'Orders',
  'workspace.tasks': 'Tasks',
  'workspace.payments': 'Payments',
  'workspace.products': 'Products',
  'workspace.checkout': 'Checkout Links',
  'workspace.messages': 'Messages',
  'workspace.calendar': 'Calendar',
  'workspace.crm': 'CRM',
  'products.addProduct': 'Add Product',
  'products.editProduct': 'Edit Product',
  'products.name': 'Name',
  'products.price': 'Price',
  'products.cost': 'Cost',
  'products.sku': 'SKU',
  'products.stock': 'Inventory',
  'products.category': 'Category',
  'products.lowStock': 'Low Stock',
  'products.outOfStock': 'Out of Stock',
  'products.active': 'Active',
  'products.inactive': 'Inactive',
  'ai.batteryLow': 'AI battery low. Recharge or use manual mode.',
  'ai.running': 'AI processing...',
  'ai.creditsLeft': 'Credits remaining',
}

const pt: Record<string, string> = {
  'loading': 'Carregando...',
  'save': 'Salvar',
  'cancel': 'Cancelar',
  'delete': 'Excluir',
  'edit': 'Editar',
  'add': 'Adicionar',
  'search': 'Buscar',
  'close': 'Fechar',
  'confirm': 'Confirmar',
  'back': 'Voltar',
  'next': 'Próximo',
  'submit': 'Enviar',
  'create': 'Criar',
  'update': 'Atualizar',
  'done': 'Pronto',
  'error.generic': 'Algo deu errado. Tente novamente.',
  'error.network': 'Erro de conexão. Verifique sua internet.',
  'error.notFound': 'Não encontrado.',
  'error.unauthorized': 'Não autorizado.',
  'workspace.leads': 'Contatos',
  'workspace.orders': 'Pedidos',
  'workspace.tasks': 'Tarefas',
  'workspace.payments': 'Pagamentos',
  'workspace.products': 'Produtos',
  'workspace.checkout': 'Links de Pagamento',
  'workspace.messages': 'Mensagens',
  'workspace.calendar': 'Calendário',
  'workspace.crm': 'CRM',
  'products.addProduct': 'Adicionar Produto',
  'products.editProduct': 'Editar Produto',
  'products.name': 'Nome',
  'products.price': 'Preço',
  'products.cost': 'Custo',
  'products.sku': 'SKU',
  'products.stock': 'Estoque',
  'products.category': 'Categoria',
  'products.lowStock': 'Estoque Baixo',
  'products.outOfStock': 'Esgotado',
  'products.active': 'Ativos',
  'products.inactive': 'Inativo',
  'ai.batteryLow': 'Bateria AI baixa. Recarregue ou use modo manual.',
  'ai.running': 'AI processando...',
  'ai.creditsLeft': 'Créditos restantes',
}

export type Locale = 'en' | 'es' | 'pt'

const dictionaries: Record<Locale, Record<string, string>> = { en, es, pt }

let currentLocale: Locale = 'es'

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

/** Translate a key. Returns string for current locale with English fallback. */
export function t(key: string): string {
  return dictionaries[currentLocale]?.[key] ?? en[key] ?? key
}
