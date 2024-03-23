import mongoose, { InferSchemaType } from "mongoose";

export const OrderSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    userChatId: { type: Number, required: true }
});

export type OrderSchemaType = InferSchemaType<typeof OrderSchema>;
