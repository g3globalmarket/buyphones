import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  async check() {
    // MongoDB connection states:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    const dbState = this.connection.readyState;
    const isDbConnected = dbState === 1;

    return {
      status: isDbConnected ? 'ok' : 'error',
      database: {
        connected: isDbConnected,
        state: dbState,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('z')
  async checkAlias() {
    return this.check();
  }
}
