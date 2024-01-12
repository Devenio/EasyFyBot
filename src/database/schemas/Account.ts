import mongoose, { InferSchemaType } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";

export enum AVAILABLE_PROP_FIRMS {
    SGB = "SGB",
    PROPIY = "PROPIY",
    TAMIN_SARMAYE = "TAMIN_SARMAYE"
}

const BidOrderModel = mongoose.models[DATABASE_MODELS.BID_ORDER];

export const AccountSchema = new mongoose.Schema({
    prop_firm: { type: String, enum: Object.values(AVAILABLE_PROP_FIRMS), required: true },
    fund: { type: Number, required: true },
    min_bid_price: { type: Number, required: true },
    bid_orders: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: BidOrderModel,
            },
        ],
        default: [],
    },
});

export type AccountSchemaType = InferSchemaType<typeof AccountSchema>;
