import { config } from "dotenv";
import mongoose from 'mongoose';
import { DATABASE_MODELS } from "../utils/constant";
import { UserSchema } from "./schemas/User";

config();

export function startDatabase() {
    const { DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
    
    mongoose
        .connect(`mongodb://${DB_USERNAME}:${DB_PASSWORD}@127.0.0.1:27017/${DB_NAME}?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin`)
        .then(() => {
            console.log("Connected to Database ✅");
        })
        .catch(err => {
            console.log("Unable to connect to Database ❌");
            console.log("Error: ", err);
        });

    mongoose.model(DATABASE_MODELS.USER, UserSchema);
}