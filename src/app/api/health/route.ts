import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { logger } from "@/lib/logging/logger";
import { config, env } from "@/lib/config/environment";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || `health-${Date.now()}`;
  
  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Check system resources
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Check environment configuration
    const envErrors = validateEnvironment();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId,
      environment: env.name,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(uptime),
      checks: {
        database: {
          status: 'healthy',
          responseTime: dbResponseTime,
          threshold: 1000, // 1 second
        },
        memory: {
          status: memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'healthy' : 'warning', // 100MB threshold
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        configuration: {
          status: envErrors.length === 0 ? 'healthy' : 'error',
          errors: envErrors,
        },
      },
      config: {
        features: config.features,
        logging: {
          level: config.logging.level,
          enableConsole: config.logging.enableConsole,
          enableFile: config.logging.enableFile,
        },
        cache: {
          enableRedis: config.cache.enableRedis,
        },
      },
      responseTime: Date.now() - startTime,
    };
    
    // Determine overall status
    const hasErrors = envErrors.length > 0;
    const hasWarnings = memoryUsage.heapUsed > 100 * 1024 * 1024;
    const isHealthy = !hasErrors && !hasWarnings;
    
    if (!isHealthy) {
      healthStatus.status = hasErrors ? 'unhealthy' : 'degraded';
    }
    
    // Log health check
    logger.info('Health check completed', {
      requestId,
      status: healthStatus.status,
      responseTime: healthStatus.responseTime,
      dbResponseTime,
      memoryUsage: healthStatus.checks.memory,
    });
    
    const statusCode = hasErrors ? 503 : hasWarnings ? 200 : 200;
    
    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      error: error instanceof Error ? error.message : 'Health check failed',
      responseTime,
    }, { status: 503 });
  }
}

// Import the validation function
function validateEnvironment(): string[] {
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
