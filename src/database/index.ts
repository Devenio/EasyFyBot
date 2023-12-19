import { config } from "dotenv";
import mongoose from "mongoose";
import { DATABASE_MODELS } from "../utils/constant";
import { UserSchema } from "./schemas/User";
import { ChannelSchema } from "./schemas/Channel";
import { BotSchema } from "./schemas/Bot";

config();

export async function startDatabase() {
    const { DB_USERNAME, DB_PASSWORD, DB_NAME, DB_URL } = process.env;

    try {
        await mongoose.connect(
            DB_URL ||
                `mongodb://${DB_USERNAME}:${DB_PASSWORD}@127.0.0.1:27017/${DB_NAME}?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin`
        );

        console.log("Connected to Database ✅");
        setModels();
    } catch (error) {
        console.log("Unable to connect to Database ❌");
        console.log("Error: ", error);
    }
}

function setModels() {
    mongoose.model(DATABASE_MODELS.USER, UserSchema);
    mongoose.model(DATABASE_MODELS.CHANNEL, ChannelSchema);
    mongoose.model(DATABASE_MODELS.BOT, BotSchema);
}
