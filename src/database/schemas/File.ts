import { randomUUID } from "crypto";
import mongoose, { InferSchemaType } from "mongoose";

export enum FILE_TYPES {
    VIDEO = "VIDEO",
    PHOTO = "PHOTO",
}

export const FileSchema = new mongoose.Schema({
    file_id: { type: String, required: true },
    type: { type: String, enum: FILE_TYPES, required: true },
    downloads: { type: Number, default: 0, required: false },
    likes: { type: Number, default: 0, required: false },
    short_id: { type: String, required: true },
});

export type FileSchemaType = InferSchemaType<typeof FileSchema>;
