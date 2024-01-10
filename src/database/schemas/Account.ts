import mongoose, { InferSchemaType } from "mongoose";

export const AccountSchema = new mongoose.Schema({
    prop_firm: { type: String, required: true },
    fund: { type: Number, required: true },
    min_bid_price: { type: Number, required: true },
    bid_orders: { type: Number, required: true },
});

export type AccountSchemaType = InferSchemaType<typeof AccountSchema>;
