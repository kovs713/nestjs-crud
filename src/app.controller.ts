import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller()
export class AppController {
  constructor() {}

  @Get('/health')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns a plain-text status used by load balancers and uptime probes. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is up',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return { status: 'OK' };
  }
}
