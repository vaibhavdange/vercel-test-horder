export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    const error = entry.error ? ` | Error: ${entry.error.message}` : '';
    const metadata = [
      entry.userId && `User: ${entry.userId}`,
      entry.requestId && `Request: ${entry.requestId}`,
      entry.ip && `IP: ${entry.ip}`,
      entry.userAgent && `UA: ${entry.userAgent}`
    ].filter(Boolean).join(' | ');

    return `[${timestamp}] ${level} | ${entry.message}${context}${error}${metadata ? ` | ${metadata}` : ''}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, metadata?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      ...metadata
    };

    const formattedLog = this.formatLog(entry);

    // In development, log to console with colors
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.INFO]: '\x1b[36m',  // Cyan
        [LogLevel.DEBUG]: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level]}${formattedLog}${reset}`);
    } else {
      // In production, log to console (replace with proper logging service)
      console.log(formattedLog);
    }

    // TODO: In production, send to logging service (e.g., Winston, Pino, or cloud logging)
    // this.sendToLoggingService(entry);
  }

  error(message: string, context?: Record<string, any>, error?: Error, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  warn(message: string, context?: Record<string, any>, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, context, undefined, metadata);
  }

  info(message: string, context?: Record<string, any>, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  debug(message: string, context?: Record<string, any>, metadata?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  // Method to log API requests
  logRequest(method: string, url: string, statusCode: number, duration: number, metadata?: Partial<LogEntry>): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    this.log(level, message, { method, url, statusCode, duration }, undefined, metadata);
  }

  // Method to log database operations
  logDatabase(operation: string, table: string, duration: number, success: boolean, metadata?: Partial<LogEntry>): void {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    const message = `DB ${operation} on ${table} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;
    
    this.log(level, message, { operation, table, duration, success }, undefined, metadata);
  }
}

export const logger = new Logger();
