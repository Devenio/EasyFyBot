import mongoose, { InferSchemaType } from "mongoose";

const enum CATEGORIES {
    EXCHANGE = "صرافی ارز دیجیتال",
    FREELANCERS = "فریلنسر ها و برنامه نویسان",
    BROKERS = "بروکر ها",
    CURRENCY_ACCOUNTS = "حساب های ارزی",
    MQL = "MQL4 و MQL5",
    GAMERS = "گیمر ها",
    PROPFIRMS = "پراپ فرم ها"
}

export const CategorySchema = new mongoose.Schema({
    title: { type: Number, required: true },
    type: { type: String, requierd: true }
});

export type CategorySchemaType = InferSchemaType<typeof CategorySchema>;
