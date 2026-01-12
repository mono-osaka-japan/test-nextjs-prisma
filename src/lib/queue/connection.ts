import { Redis, RedisOptions } from 'ioredis';

// ============================================
// Types
// ============================================

export interface RedisConnectionConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableOfflineQueue?: boolean;
  lazyConnect?: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  ready: boolean;
  reconnecting: boolean;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: Required<RedisConnectionConfig> = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetries: 10,
  retryDelay: 1000,
  enableOfflineQueue: true,
  lazyConnect: false,
};

// ============================================
// Connection Singleton
// ============================================

let redisConnection: Redis | null = null;
let subscriberConnection: Redis | null = null;

// ============================================
// Connection Factory
// ============================================

function createRedisOptions(config: RedisConnectionConfig): RedisOptions {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    host: mergedConfig.host,
    port: mergedConfig.port,
    password: mergedConfig.password || undefined,
    db: mergedConfig.db,
    enableOfflineQueue: mergedConfig.enableOfflineQueue,
    lazyConnect: mergedConfig.lazyConnect,
    retryStrategy: (times: number) => {
      if (times > mergedConfig.maxRetries) {
        return null; // Stop retrying
      }
      return Math.min(times * mergedConfig.retryDelay, 30000);
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  };
}

// ============================================
// Connection Management
// ============================================

export function getRedisConnection(
  config: RedisConnectionConfig = {}
): Redis {
  if (!redisConnection) {
    const options = createRedisOptions(config);
    redisConnection = new Redis(options);

    redisConnection.on('error', (error) => {
      console.error('Redis connection error:', error.message);
    });

    redisConnection.on('connect', () => {
      console.log('Redis connected');
    });

    redisConnection.on('ready', () => {
      console.log('Redis ready');
    });

    redisConnection.on('close', () => {
      console.log('Redis connection closed');
    });

    redisConnection.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }

  return redisConnection;
}

export function getSubscriberConnection(
  config: RedisConnectionConfig = {}
): Redis {
  if (!subscriberConnection) {
    const options = createRedisOptions(config);
    subscriberConnection = new Redis(options);

    subscriberConnection.on('error', (error) => {
      console.error('Redis subscriber error:', error.message);
    });
  }

  return subscriberConnection;
}

export async function closeConnections(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (redisConnection) {
    promises.push(
      redisConnection.quit().then(() => {
        redisConnection = null;
      })
    );
  }

  if (subscriberConnection) {
    promises.push(
      subscriberConnection.quit().then(() => {
        subscriberConnection = null;
      })
    );
  }

  await Promise.all(promises);
}

export function getConnectionStatus(): ConnectionStatus {
  if (!redisConnection) {
    return {
      connected: false,
      ready: false,
      reconnecting: false,
    };
  }

  return {
    connected: redisConnection.status === 'connect',
    ready: redisConnection.status === 'ready',
    reconnecting: redisConnection.status === 'reconnecting',
  };
}

// ============================================
// Health Check
// ============================================

export async function healthCheck(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  try {
    const connection = getRedisConnection();
    const start = Date.now();
    await connection.ping();
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: -1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// BullMQ Connection Options
// ============================================

export function getBullMQConnectionOptions(
  config: RedisConnectionConfig = {}
): { connection: Redis } {
  return {
    connection: getRedisConnection(config),
  };
}

export function getBullMQQueueOptions(
  config: RedisConnectionConfig = {}
): { connection: Redis } {
  return {
    connection: getRedisConnection(config),
  };
}

// ============================================
// Utility Functions
// ============================================

export async function flushDatabase(): Promise<void> {
  const connection = getRedisConnection();
  await connection.flushdb();
}

export async function getQueueKeys(prefix: string = 'bull'): Promise<string[]> {
  const connection = getRedisConnection();
  return connection.keys(`${prefix}:*`);
}

export async function deleteQueueKeys(prefix: string = 'bull'): Promise<number> {
  const connection = getRedisConnection();
  const keys = await getQueueKeys(prefix);

  if (keys.length === 0) {
    return 0;
  }

  return connection.del(...keys);
}
