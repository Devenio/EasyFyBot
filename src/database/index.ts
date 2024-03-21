import { config } from "dotenv";
import mongoose from "mongoose";
import { DATABASE_MODELS } from "../utils/constant";
import { CategorySchema, CategorySchemaType } from "./schemas/Category";
import { ProductSchema } from "./schemas/Product";

config();

const enum CATEGORIES {
    EXCHANGE = "EXCHANGE",
    FREELANCERS = "FREELANCERS",
    BROKERS = "BROKERS",
    CURRENCY_ACCOUNTS = "CURRENCY_ACCOUNTS",
    MQL = "MQL",
    GAMERS = "GAMERS",
    PROPFIRMS = "PROPFIRMS",
}

const initCategories = [
    {
        title: "صرافی ارز دیجیتال",
        type: CATEGORIES.EXCHANGE,
    },
    {
        title: "فریلنسر ها و برنامه نویسان",
        type: CATEGORIES.FREELANCERS,
    },
    {
        title: "بروکر ها",
        type: CATEGORIES.BROKERS,
    },
    {
        title: "حساب های ارزی",
        type: CATEGORIES.CURRENCY_ACCOUNTS,
    },
    {
        title: "MQL4 و MQL5",
        type: CATEGORIES.MQL,
    },
    {
        title: "گیمر ها",
        type: CATEGORIES.GAMERS,
    },
    {
        title: "پراپ فرم ها",
        type: CATEGORIES.PROPFIRMS,
    },
];

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
    mongoose.model(DATABASE_MODELS.PRODUCT, ProductSchema);

    initCategories.forEach(async (category) => {
        const isExisted = await categoryModel.findOne({ type: category.type })
        if(!isExisted) {
            const doc = new categoryModel({ title: category.title, type: category.type });
            await doc.save();
        }
    });
}
