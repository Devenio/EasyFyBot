import mongoose, { InferSchemaType, SchemaTypes } from "mongoose";

export const BidOrderSchema = new mongoose.Schema({
    user_chat_id: { type: Number, required: true },
    account_id: { type: SchemaTypes.ObjectId, required: true },
    bid_price: { type: Number, required: false },
    is_valid: { type: Boolean, default: false, required: false },
    created_date: { type: Date, default: Date.now, required: false },
});

export type BidOrderSchemaType = InferSchemaType<typeof BidOrderSchema>;
