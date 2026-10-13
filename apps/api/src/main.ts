import { createConfig } from "@citydental/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  // ConfigModule (inside AppModule) loads the repo-root .env into
  // process.env during module initialization, so the validated config
  // must be created after the app exists.
  const app = await NestFactory.create(AppModule);

  // Fails fast with a readable report when required variables are missing.
  const config = createConfig();

  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();

  await app.listen(config.env.API_PORT);
  console.log(`city-dental API listening on http://localhost:${config.env.API_PORT}/api/v1`);
}

void bootstrap();
