import { config } from "dotenv";
import mongoose from "mongoose";
import { DATABASE_MODELS } from "../utils/constant";
import { CategorySchema } from "./schemas/Category";
import { ProductSchema } from "./schemas/Product";

config();

export async function startDatabase() {
    const { DB_URL } = process.env;

    try {
        await mongoose.connect(DB_URL || '');

        console.log("Connected to Database ✅");
        setModels();
    } catch (error) {
        console.error("Unable to connect to Database ❌");
        console.error("Error: ", error);
    }
}

function setModels() {
    mongoose.model(DATABASE_MODELS.CATEGORY, CategorySchema);
    mongoose.model(DATABASE_MODELS.PRODUCT, ProductSchema);
}
