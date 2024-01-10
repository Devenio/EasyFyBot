import mongoose, { InferSchemaType } from "mongoose";

export const BidSchema = new mongoose.Schema({
    accounts: { type: Number, required: true },
    start_date: { type: Number, required: true },
    expired_date: { type: Date, required: true },
    created_date: { type: Date, default: Date.now, required: false },
});

export type BidSchemaType = InferSchemaType<typeof BidSchema>;
