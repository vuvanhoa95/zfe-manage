/**
 * Logging utility for Dashboard/Report errors and events
 */

type LogLevel = 'info' | 'warn' | 'error';

type LogContext = {
    module?: 'dashboard' | 'report' | 'task' | 'other';
    action?: string;
    projectId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
};

/**
 * Log message với context
 */
function log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...context,
    };

    // Development: log to console với format đẹp
    if (process.env.NODE_ENV === 'development') {
        const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [${timestamp}] ${message}`, context || '');
    }

    // Production: có thể gửi đến logging service (Sentry, LogRocket, etc.)
    // TODO: Integrate với logging service khi cần
    if (process.env.NODE_ENV === 'production' && level === 'error') {
        // Example: send to external service
        // await sendToLoggingService(logEntry);
    }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext) {
    log('info', message, context);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext) {
    log('warn', message, context);
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    log('error', `${message}: ${errorMessage}`, {
        ...context,
        metadata: {
            ...context?.metadata,
            errorStack,
        },
    });
}

/**
 * Log Dashboard-specific events
 */
export const dashboardLogger = {
    fetchError: (error: Error | unknown, projectId?: string, userId?: string) => {
        logError('Dashboard: Failed to fetch tasks', error, {
            module: 'dashboard',
            action: 'fetch_tasks',
            projectId,
            userId,
        });
    },
    filterChange: (filterType: string, value: string, projectId?: string) => {
        logInfo('Dashboard: Filter changed', {
            module: 'dashboard',
            action: 'filter_change',
            projectId,
            metadata: { filterType, value },
        });
    },
    accessDenied: (userId?: string, projectId?: string) => {
        logWarn('Dashboard: Access denied', {
            module: 'dashboard',
            action: 'access_denied',
            userId,
            projectId,
        });
    },
};

/**
 * Log Report-specific events
 */
export const reportLogger = {
    fetchError: (error: Error | unknown, projectId?: string, userId?: string) => {
        logError('Report: Failed to fetch report data', error, {
            module: 'report',
            action: 'fetch_report',
            projectId,
            userId,
        });
    },
    exportError: (error: Error | unknown, reportType: string, projectId?: string) => {
        logError('Report: Failed to export Excel', error, {
            module: 'report',
            action: 'export_excel',
            projectId,
            metadata: { reportType },
        });
    },
    printError: (error: Error | unknown, projectId?: string) => {
        logError('Report: Failed to print', error, {
            module: 'report',
            action: 'print',
            projectId,
        });
    },
    accessDenied: (userId?: string, projectId?: string) => {
        logWarn('Report: Access denied', {
            module: 'report',
            action: 'access_denied',
            userId,
            projectId,
        });
    },
};
