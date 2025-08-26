export interface EnvironmentConfig {
  // Database
  database: {
    url: string;
    poolSize: number;
    timeout: number;
  };
  
  // Server
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  
  // Security
  security: {
    jwtSecret: string;
    bcryptRounds: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  
  // Logging
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
    logFilePath?: string;
  };
  
  // Cache
  cache: {
    ttl: number;
    maxSize: number;
    enableRedis: boolean;
    redisUrl?: string;
  };
  
  // External Services
  external: {
    paymentGateway: {
      url: string;
      apiKey: string;
      timeout: number;
    };
    emailService: {
      url: string;
      apiKey: string;
      fromEmail: string;
    };
  };
  
  // Feature Flags
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableBackup: boolean;
    enableMonitoring: boolean;
  };
}

// Development configuration
const developmentConfig: EnvironmentConfig = {
  database: {
    url: process.env.DATABASE_URL || 'file:./pos.db',
    poolSize: 1,
    timeout: 5000,
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    bcryptRounds: 10,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    enableConsole: true,
    enableFile: false,
  },
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    enableRedis: false,
  },
  external: {
    paymentGateway: {
      url: process.env.PAYMENT_GATEWAY_URL || 'https://api.stripe.com',
      apiKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
      timeout: 10000,
    },
    emailService: {
      url: process.env.EMAIL_SERVICE_URL || 'https://api.sendgrid.com',
      apiKey: process.env.SENDGRID_API_KEY || 'SG...',
      fromEmail: process.env.FROM_EMAIL || 'noreply@horder.com',
    },
  },
  features: {
    enableAnalytics: false,
    enableNotifications: false,
    enableBackup: false,
    enableMonitoring: false,
  },
};

// Production configuration
const productionConfig: EnvironmentConfig = {
  database: {
    url: process.env.DATABASE_URL || 'file:./pos.db',
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://horder.com'],
      credentials: true,
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    bcryptRounds: 12,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '3'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: false,
    enableFile: true,
    logFilePath: process.env.LOG_FILE_PATH || '/var/log/horder/app.log',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300000'), // 5 minutes
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000'),
    enableRedis: process.env.ENABLE_REDIS === 'true',
    redisUrl: process.env.REDIS_URL,
  },
  external: {
    paymentGateway: {
      url: process.env.PAYMENT_GATEWAY_URL || 'https://api.stripe.com',
      apiKey: process.env.STRIPE_SECRET_KEY || '',
      timeout: parseInt(process.env.PAYMENT_TIMEOUT || '15000'),
    },
    emailService: {
      url: process.env.EMAIL_SERVICE_URL || 'https://api.sendgrid.com',
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@horder.com',
    },
  },
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
    enableBackup: process.env.ENABLE_BACKUP === 'true',
    enableMonitoring: process.env.ENABLE_MONITORING === 'true',
  },
};

// Test configuration
const testConfig: EnvironmentConfig = {
  ...developmentConfig,
  database: {
    url: ':memory:',
    poolSize: 1,
    timeout: 1000,
  },
  logging: {
    level: 'error',
    enableConsole: false,
    enableFile: false,
  },
  features: {
    enableAnalytics: false,
    enableNotifications: false,
    enableBackup: false,
    enableMonitoring: false,
  },
};

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Export configuration based on environment
export const config: EnvironmentConfig = 
  environment === 'production' ? productionConfig :
  environment === 'test' ? testConfig :
  developmentConfig;

// Export environment info
export const env = {
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isTest: environment === 'test',
  name: environment,
};

// Validate required environment variables
export function validateEnvironment(): string[] {
  const errors: string[] = [];
  
  if (env.isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
    
    if (!process.env.DATABASE_URL) {
      errors.push('DATABASE_URL must be set in production');
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      errors.push('STRIPE_SECRET_KEY must be set in production');
    }
  }
  
  return errors;
}

// Export validation function
export const validateEnv = validateEnvironment;
