import mongoose, { InferSchemaType } from "mongoose";

export const CategorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, required: true }
});

export type CategorySchemaType = InferSchemaType<typeof CategorySchema>;
