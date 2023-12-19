import { config } from "dotenv";
import { startDatabase } from "./database";

config();

async function bootstrap() {
    console.log("Bot Starting...");

    await startDatabase();

    console.log("\nBot Started :)");
}

bootstrap();
