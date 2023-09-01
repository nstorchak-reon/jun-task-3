import express from "express";
import { config } from "./config";
import api from "./amo";
import { getFieldValues, sumArray } from "./utils";
import { mainLogger } from "./logger"
import { LeadData } from "./types/lead/lead";
import { Contact } from "./types/contacts/contact";
import { Customfield } from "./types/customField/customField";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

api.getAccessToken().then(() => {

    const TASK_TYPE = 3048802
    const CURRENT_DATE = new Date()
    const TO_SECONDS_FORMATER = 1000

    app.post("/change-offer", async (req, res) => {
        const leadPrice = Number(req.body.leads.update[0].price)
        const leadId:number = Number(await req.body.leads.update[0].id)
        const taskCompletedText = {
            "is_completed": true,
            "result": {
                "text": "Бюджет проверен, ошибок нет"
            }
        }

        await api.updateTasks(taskCompletedText, TASK_TYPE, leadId )
        
        const lead:LeadData = await api.getDeal(leadId, ['contacts'])
        const contactID:number = lead._embedded?.contacts?.find(field => field.is_main === true)?.id || 0
        const contact:Contact = await api.getContact(contactID)
        const customFields:Array<Customfield> = contact.custom_fields_values || []
        const fieldId:number = customFields.find((field:Customfield) => field.field_name === 'Услуги')?.field_id || 0
        const offerList:string[] = await getFieldValues(customFields, fieldId)
        const offerPriceList:number[] = [0, 0]

        offerList.map((item:string) => {
            const field:Customfield|undefined = customFields.find((field:Customfield) => field.field_name === item) 

            offerPriceList.push(field !== undefined ? Number(field.values[0].value) : 0)
        })
        const finalPrice:number = offerPriceList.reduce(sumArray)
        const newLead = {
            id: leadId,
            price: finalPrice
        }
        
        if (leadPrice !== finalPrice) {
            await api.updateDeals(newLead)
            const deadline = Date.parse(String(CURRENT_DATE)) + (24 * 60 * 60 * TO_SECONDS_FORMATER)
            const newTask = {
                "task_type_id": TASK_TYPE,
                "text": "Проверить бюджет",
                "complete_till": Math.floor(deadline / TO_SECONDS_FORMATER),
                "entity_id": leadId,
                "entity_type": "leads",
            }

            await api.createTasks(newTask, TASK_TYPE, leadId )
            
        }
		res.send("OK");
    });
})

app.listen(config.PORT, ()=> mainLogger.debug('Server started on ', config.PORT))





