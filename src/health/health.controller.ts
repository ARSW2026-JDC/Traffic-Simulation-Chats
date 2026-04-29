import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthCheck {
  status: 'pass' | 'fail';
  latencyMs?: number;
  error?: string;
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async check() {
    const checks = {
      database: await this.checkDatabase(),
    };

    const allPass = Object.values(checks).every((c) => c.status === 'pass');

    return {
      status: allPass ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'pass', latencyMs: Date.now() - start };
    } catch (err) {
      return {
        status: 'fail',
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}
