/**
 * Centralized logging utility
 * In production, errors are logged to a monitoring service
 * In development, logs are output to console
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message, context);
    
    if (this.isDevelopment) {
      console.error(formattedMessage, error);
    } else {
      // In production, send to monitoring service (e.g., Sentry, DataDog)
      // For now, still log to console but could be replaced
      console.error(formattedMessage);
    }
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context);
    
    if (this.isDevelopment) {
      console.warn(formattedMessage);
    }
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('info', message, context);
    
    if (this.isDevelopment) {
      console.log(formattedMessage);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, context);
      console.log(formattedMessage);
    }
  }
}

export const logger = new Logger();
