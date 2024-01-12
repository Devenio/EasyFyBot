import { DATABASE_MODELS } from "../../utils/constant";
import { BidSchema, BidSchemaType } from "../schemas/Bid";
import { BaseService } from "./base.service";

export class BidService extends BaseService<BidSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.BID,
            schema: BidSchema,
        });
    }

    findActiveBids() {
        return this.find({
            is_active: true,
        });
    }

    findBidAccounts(bidId: string) {
        return this.collection
            .findById(bidId)
            .populate({
                path: "accounts",
                model: "Account",
            })
            .exec()
    }
}
