import express from "express";
import api from "./amo";
import { getFieldValues, sumArray } from "./utils";
import { mainLogger } from "./logger"
import { config } from "./config";
import { LeadData } from "./types/lead/lead";
import { Contact } from "./types/contacts/contact";
import { Customfield } from "./types/customField/customField";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

api.getAccessToken().then(() => {
    app.post("/change-offer", async (req, res) => {
        const LEAD_ID:number = 26190307
        const LEAD:LeadData = await api.getDeal(LEAD_ID, ['contacts'])
        const CONTACT_ID:number|undefined = LEAD._embedded?.contacts?.find(field => field.is_main === true)?.id
        const CONTACT:Contact = await api.getContact(CONTACT_ID)
        const CUSTOM_FIELDS:Array<Customfield> = CONTACT.custom_fields_values || []
        const FIELD_ID:number = CUSTOM_FIELDS.find((field:any) => field.field_name === 'Услуги')?.field_id || 0
        const OFFERS_LIST:string[] = await getFieldValues(CUSTOM_FIELDS, FIELD_ID)
        const OFFERS_PRICE_LIST:number[] = []

        OFFERS_LIST.map((item:string) => {
            const FIELD:Customfield|any = CUSTOM_FIELDS.find((field:Customfield) => field.field_name === item)
            OFFERS_PRICE_LIST.push(Number(FIELD.values[0].value))
        })

        const FINAL_PRICE:any = OFFERS_PRICE_LIST.reduce(sumArray)
        const NEW_LEAD = {
            id: LEAD_ID,
            price: FINAL_PRICE
        }

        await api.updateDeals(NEW_LEAD)
        
		res.send("OK");
    });
})

app.listen(config.PORT, ()=> mainLogger.debug('Server started on ', config.PORT))





