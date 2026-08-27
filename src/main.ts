import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AllConfigType } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);
  const corsOrigins = configService.getOrThrow('app.corsOrigins', {
    infer: true,
  });

  app.enableCors(corsOrigins);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );

  const options = new DocumentBuilder()
    .setTitle('NestJS CRUD API')
    .setDescription(
      'REST API with JWT authentication.\n\n' +
        '- `auth` endpoints issue access tokens and set an http-only refresh token cookie.\n' +
        '- `users` endpoints require a bearer access token; write access to other users is admin-only.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('health', 'Service liveness checks')
    .addTag('auth', 'Registration, login, token refresh and logout')
    .addTag('users', 'User CRUD operations')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
