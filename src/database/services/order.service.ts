import { DATABASE_MODELS } from "../../utils/constant";
import { OrderSchema, OrderSchemaType } from "../schemas/Order";
import { BaseService } from "./base.service";

export class OrderService extends BaseService<OrderSchemaType> {
    constructor() {
        super({
            modelName: DATABASE_MODELS.ORDER,
            schema: OrderSchema,
        });
    }
}
