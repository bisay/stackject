import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    console.log("🟡 [DEBUG] Starting Bootstrap...");

    try {
        console.log("🟡 [DEBUG] Creating Nest App...");
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Force full logging
        });

        console.log("🟢 [DEBUG] Nest App Created!");

        app.use(cookieParser());


        // Security: Helmet
        const helmet = require('helmet');
        app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
            contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
        }));

        // Build CORS origins list
        const corsOrigins: string[] = [];
        
        // Always add configured frontend URL
        if (process.env.FRONTEND_URL) {
            corsOrigins.push(process.env.FRONTEND_URL);
        }
        
        // Always add configured admin URL
        if (process.env.ADMIN_URL) {
            corsOrigins.push(process.env.ADMIN_URL);
        }
        
        // In development, add localhost fallbacks
        if (process.env.NODE_ENV !== 'production') {
            corsOrigins.push('http://localhost:3000', 'http://localhost:3002');
        }

        // Enable CORS for frontend
        app.enableCors({
            origin: corsOrigins.length > 0 ? corsOrigins : ['http://localhost:3000', 'http://localhost:3002'],
            credentials: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            allowedHeaders: 'Content-Type, Accept, Authorization',
        });

        console.log("🟡 [DEBUG] Listening on 3001...");
        await app.listen(3001);
        console.log("🟢 [DEBUG] Server Running on http://localhost:3001");
    } catch (error) {
        console.error("🔴 [FATAL] Bootstrap Failed:", error);
    }
}
bootstrap();
