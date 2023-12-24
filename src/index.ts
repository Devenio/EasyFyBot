import { config } from "dotenv";
import { MainBot } from "./bots";
import { startDatabase } from "./database";

config();

async function bootstrap() {    

    try {
        console.log("Bot Starting...\n");

        await startDatabase();
        startBots();

        console.log("\nBot Started :)");
    } catch (error) {
        console.error("ERROR: ", error)
    }

}

function startBots() {
    new MainBot({
        token: process.env.BOT_TOKEN || "",
    });
}

bootstrap();
