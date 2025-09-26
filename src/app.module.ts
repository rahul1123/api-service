import { Module ,NestModule,MiddlewareConsumer} from '@nestjs/common';
import { ConfigModule,ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';;
import { ApiMiddleware } from './middleware/api.middleware';
import { UtilService } from './util/util.service';
import { DbService } from './db/db.service';
import { ErrorLoggerService } from './error-logger/error-logger.service';
import { AesService } from './services/aes/aes.service';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { AuthController } from './auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, // So you can use ConfigService anywhere without importing again
    }),// JWT setup using environment variable
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'fallbackSecretKey',
        signOptions: { expiresIn: '1h' },
      }),
    }),],
  controllers: [AppController,UserController,AuthController],
  providers: [AppService,UtilService,DbService,ErrorLoggerService,AesService,AuthService,UserService,
    AuthService],
})
//with middle ware 
//without export class AppModule
 export class AppModule implements NestModule
  {
 configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiMiddleware).exclude()
      .forRoutes('*')
  }

}
