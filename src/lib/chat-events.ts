import { EventEmitter } from 'events';
import type { SelectMessage } from '@/schema';

// Pub/sub in-process pour le chat temps réel (SSE). Le déploiement tourne en un seul
// container `app` (docker-compose, pas de réplicas), donc un EventEmitter en mémoire
// suffit — pas besoin de Redis. À remplacer par un pub/sub externe si l'app passe
// un jour en multi-instance.
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function channelName(conversationId: number) {
  return `conversation:${conversationId}`;
}

export function publishMessage(conversationId: number, message: SelectMessage) {
  emitter.emit(channelName(conversationId), message);
}

export function subscribeToConversation(
  conversationId: number,
  onMessage: (message: SelectMessage) => void
) {
  const channel = channelName(conversationId);
  emitter.on(channel, onMessage);
  return () => emitter.off(channel, onMessage);
}
