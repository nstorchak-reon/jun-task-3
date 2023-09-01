import moment from "moment";
import fs from "fs";

const sumArray = (total:any, num:any) => {
    return total + num;
}

const getFieldValue = (customFields:Array<any>, fieldId:number) => {
    const field = customFields
        ? customFields.find((item) => String(item.field_id || item.id) === String(fieldId))
        : undefined;
    const value = field ? field.values[0].value : undefined;
    return value;
};

const getFieldValues = (customFields:Array<any>, fieldId:number) => {
    const field = customFields
        ? customFields.find((item) => String(item.field_id || item.id) === String(fieldId))
        : undefined;
    const values = field ? field.values : [];
    return values.map((item:any) => item.value);
};

//функция для разбиения запроса на создание на несколько по chunkSize
const bulkOperation = async (
    request: (data: any) => Promise<any>,
    data:Array<any>,
    chunkSize: number,
    operationName = "bulk"
) => {
    let failed = [];
    if (data.length) {
        console.log(`Start operation of ${operationName}`);
        const result = [];
        try {
            const chunksCount = data.length / chunkSize;
            for (let i = 0; i < chunksCount; i++) {
                try {
                    const sliced = data.slice(i * chunkSize, (i + 1) * chunkSize);
                    const requestResult:any[] = await request(sliced);
                    if (requestResult && requestResult.length > 0) {
                        const updatedResult = requestResult.map((element, index) => {
                            if (!i) {
                                return {
                                    ...element, request_id: String(index),
                                }
                            }
                            return {
                                ...element, request_id: String((i * chunkSize) + index),
                            }
                        })
                        result.push(...updatedResult)
                    }
                } catch (e) {
                    console.log(e)
                    failed.push(...data.slice(i * chunkSize, (i + 1) * chunkSize));
                }
                console.log(
                    `${operationName} ${i * chunkSize} - ${(i + 1) * chunkSize}`
                );
            }
            return result;
        } catch (e) {
            console.log(e)
        }
    }
    console.log(
        `operation "${operationName}" finished. Failed - ${failed.length}`
    );
    fs.writeFileSync(`./bulkOperations_logs/${operationName}Failed.txt`, JSON.stringify(failed));
};

export {
	getFieldValue,
	getFieldValues,
    sumArray,
    bulkOperation,
};
