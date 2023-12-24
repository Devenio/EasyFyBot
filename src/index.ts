import { config } from "dotenv";
import { startDatabase } from "./database";
import { PikaSpotify } from "./bots/spotify";

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
    const pikaSpotify = new PikaSpotify({
        token: process.env.BOT_TOKEN_SPOTIFY || "",
    });
}

bootstrap();
