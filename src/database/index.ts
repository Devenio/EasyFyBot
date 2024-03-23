import { config } from "dotenv";
import mongoose from "mongoose";
import { DATABASE_MODELS } from "../utils/constant";
import { initCategories } from "./category.init";
import { initProducts } from "./product.init";
import { CategorySchema } from "./schemas/Category";
import { ProductSchema } from "./schemas/Product";
import { UserSchema } from "./schemas/User";
import { OrderSchema } from "./schemas/Order";

config();

export async function startDatabase() {
    const { DB_URL } = process.env;

    try {
        await mongoose.connect(DB_URL || "");

        console.log("Connected to Database ✅");
        setModels();
    } catch (error) {
        console.error("Unable to connect to Database ❌");
        console.error("Error: ", error);
    }
}

function setModels() {
    const categoryModel = mongoose.model(
        DATABASE_MODELS.CATEGORY,
        CategorySchema
    );
    const productModel = mongoose.model(DATABASE_MODELS.PRODUCT, ProductSchema);
    mongoose.model(DATABASE_MODELS.USER, UserSchema);
    mongoose.model(DATABASE_MODELS.ORDER, OrderSchema);

    console.log("> Initializing Database...");
    initCategories.forEach(async (category) => {
        const isExisted = await categoryModel.findOne({ type: category.type });
        if (!isExisted) {
            const doc = new categoryModel({
                title: category.title,
                type: category.type,
            });
            await doc.save();
        }
    });

    initProducts.forEach(async (product) => {
        const isExisted = await productModel.findOne({ title: product.title });
        if (!isExisted) {
            const doc = new productModel({ ...product });
            await doc.save();
        } else {
            await productModel.updateOne({ title: product.title }, { $set: product });
        }
    });
    console.log("> Completed!");
}
