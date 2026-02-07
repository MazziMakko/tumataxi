/**
 * i18n - Internationalization System
 * Supports English (en) and Portuguese (pt)
 */

export type Language = 'en' | 'pt';

export const TRANSLATIONS = {
  en: {
    // Home Screen
    'home.earningsToday': 'Today\'s Earnings',
    'home.level': 'Level',
    'home.demoOffer': 'Demo Offer',
    'home.online': 'Online',
    'home.offline': 'Offline',
    'home.rides': 'Rides',
    'home.rating': 'Rating',
    'home.status': 'Status',
    'home.realTimeLocation': 'Real-time location',

    // Navigation
    'nav.profile': 'Profile',
    'nav.earnings': 'Earnings',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Settings
    'settings.language': 'Language',
    'settings.notifications': 'Notifications',
    'settings.nightMode': 'Night Mode',
    'settings.emergencyContacts': 'Emergency Contacts',

    // Ride States
    'ride.waitingForOffer': 'Waiting for offer...',
    'ride.offerReceived': 'Offer received!',
    'ride.pickingUpPassenger': 'Picking up passenger',
    'ride.arrivedAtPickup': 'Arrived at pickup',
    'ride.waitingAtPickup': 'Waiting at pickup',
    'ride.rideInProgress': 'Ride in progress',
    'ride.arrivedAtDestination': 'Arrived at destination',
    'ride.tripSummary': 'Trip summary',

    // Waiting Timer
    'timer.waiting': 'Waiting',
    'timer.waitingFee': 'Waiting fee',
    'timer.cancel': 'Cancel (No-Show)',
    'timer.perMinute': 'per minute',

    // SOS
    'sos.emergency': 'Emergency',
    'sos.shareLocation': 'Share Location',
    'sos.callPolice': 'Call Police',
    'sos.recordAudio': 'Record Audio',
    'sos.close': 'Close',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
  },
  pt: {
    // Home Screen
    'home.earningsToday': 'Ganhos Hoje',
    'home.level': 'Nível',
    'home.demoOffer': 'Oferta Demo',
    'home.online': 'Online',
    'home.offline': 'Offline',
    'home.rides': 'Corridas',
    'home.rating': 'Classificação',
    'home.status': 'Status',
    'home.realTimeLocation': 'Localização em tempo real',

    // Navigation
    'nav.profile': 'Perfil',
    'nav.earnings': 'Ganhos',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair',

    // Settings
    'settings.language': 'Idioma',
    'settings.notifications': 'Notificações',
    'settings.nightMode': 'Modo Noturno',
    'settings.emergencyContacts': 'Contatos de Emergência',

    // Ride States
    'ride.waitingForOffer': 'Aguardando oferta...',
    'ride.offerReceived': 'Oferta recebida!',
    'ride.pickingUpPassenger': 'Buscando passageiro',
    'ride.arrivedAtPickup': 'Chegou ao local de coleta',
    'ride.waitingAtPickup': 'Aguardando no local de coleta',
    'ride.rideInProgress': 'Corrida em andamento',
    'ride.arrivedAtDestination': 'Chegou ao destino',
    'ride.tripSummary': 'Resumo da viagem',

    // Waiting Timer
    'timer.waiting': 'Aguardando',
    'timer.waitingFee': 'Taxa de espera',
    'timer.cancel': 'Cancelar (Não apresentação)',
    'timer.perMinute': 'por minuto',

    // SOS
    'sos.emergency': 'Emergência',
    'sos.shareLocation': 'Compartilhar Localização',
    'sos.callPolice': 'Chamar Polícia',
    'sos.recordAudio': 'Gravar Áudio',
    'sos.close': 'Fechar',

    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.close': 'Fechar',
  },
} as const;

/**
 * Get translated string by key
 */
export function t(key: keyof typeof TRANSLATIONS.en, language: Language = 'pt'): string {
  return TRANSLATIONS[language][key] || key;
}

/**
 * Toggle between English and Portuguese
 */
export function toggleLanguage(current: Language): Language {
  return current === 'en' ? 'pt' : 'en';
}
