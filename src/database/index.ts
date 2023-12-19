import { config } from "dotenv";
import mongoose from "mongoose";
import { DATABASE_MODELS } from "../utils/constant";
import { UserSchema } from "./schemas/User";
import { ChannelSchema } from "./schemas/Channel";
import { BotSchema } from "./schemas/Bot";

config();

export function startDatabase() {
    const { DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

    mongoose
        .connect(
            `mongodb://${DB_USERNAME}:${DB_PASSWORD}@127.0.0.1:27017/${DB_NAME}?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin`
        )
        .then(() => {
            console.log("Connected to Database ✅");
            setModels();
        })
        .catch((err) => {
            console.log("Unable to connect to Database ❌");
            console.log("Error: ", err);
        });
}

function setModels() {
    mongoose.model(DATABASE_MODELS.USER, UserSchema);
    mongoose.model(DATABASE_MODELS.CHANNEL, ChannelSchema);
    mongoose.model(DATABASE_MODELS.BOT, BotSchema);
}
