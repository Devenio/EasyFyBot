import mongoose, { InferSchemaType } from "mongoose";

export const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
});

export type ProductSchemaType = InferSchemaType<typeof ProductSchema>;
