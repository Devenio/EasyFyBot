import { Types } from "mongoose";
import { DATABASE_MODELS } from "../../utils/constant";
import { BidOrderSchema, BidOrderSchemaType } from "../schemas/BidOrder";
import { BaseService } from "./base.service";

export class BidOrderService extends BaseService<BidOrderSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.BID_ORDER,
            schema: BidOrderSchema,
        });
    }
}
