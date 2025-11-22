/**
 * Structured logging utility
 * Provides consistent logging with levels, context, and request correlation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
  requestId?: string;
  userId?: string;
  correlationId?: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    // In production, only log info and above unless DEBUG=true
    this.minLevel = this.environment === 'production' && !process.env.DEBUG
      ? 'info'
      : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.minLevel];
  }

  private formatLog(entry: LogEntry): string {
    if (this.environment === 'production') {
      // In production, output JSON for log aggregation
      return JSON.stringify(entry);
    } else {
      // In development, output human-readable format
      const timestamp = new Date(entry.timestamp).toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const error = entry.error ? `\n  Error: ${entry.error.name}: ${entry.error.message}${entry.error.stack ? '\n' + entry.error.stack : ''}` : '';
      return `[${timestamp}] ${level} ${entry.message}${context}${error}`;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatLog(entry);
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](formatted);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context
   * Useful for adding requestId, userId, etc. to all subsequent logs
   */
  withContext(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, childContext?: LogContext, error?: Error) => {
      const mergedContext = { ...context, ...childContext };
      originalLog(level, message, mergedContext, error);
    };
    
    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogContext, LogLevel };
