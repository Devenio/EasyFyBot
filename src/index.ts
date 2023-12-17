import { config } from "dotenv";
import { startDatabase } from "./database";

config();

async function bootstrap() {
    startDatabase();
}

bootstrap();
