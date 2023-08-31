import moment from "moment";
import fs from "fs";

const getTodayDateTime = ():string => moment().format("YYYY-MM-DD HH:MM:ss");

const getClearPhoneNumber = (tel:string | undefined) => {
	const clearNumber = !tel ? [] : tel.split("").filter(item => new RegExp(/\d/).test(item));
	if (!clearNumber.length) {
		return undefined;
	}
	return clearNumber.length > 10 ? clearNumber.join("").slice(1) : clearNumber.join("");
};
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


const makeField = (field_id:number, value?: string | number | boolean, enum_id?:number) => {
    if (!value) {
        return undefined;
    }
    return {
        field_id,
        values: [
            {
                value,
                enum_id
            },
        ],
    };
};

const getHuminizeTimeFromUnix = (unixTimeStamp: number) => {
    // Принимаем в секундах, моменту нужны миллисекунды
    const time = unixTimeStamp * 1000;
    return moment(time).format("YYYY-MM-DD HH:mm:ss.SSS")
};

const getUnixBithdate = (date:string) => {
    const unix = moment(date, "DD.MM.YYYY").utcOffset(0).unix();
    return unix;
};

const getDateUnixValue = (date:string) => {
    return moment(
        moment(date).utcOffset(3).format("DD.MM.YYYY HH:mm:ss"),
        "DD.MM.YYYY HH:mm:ss"
    ).unix();
};


/**
 * Функция возвращает мультисписковое поле для карточки контакта "Информация о санации"
 */


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

const getUniqNumbers = (numbers:number[]):number[] => {
    const numberCollection = new Set();
    numbers.forEach((number) => numberCollection.add(number));
    const uniqNumbers = Array.from(numberCollection).map(Number);
    return uniqNumbers;
};

export {
	getClearPhoneNumber,
	getFieldValue,
	getFieldValues,
    sumArray,
    makeField,
    getUnixBithdate,
    getDateUnixValue,
    bulkOperation,
    getTodayDateTime,
    getUniqNumbers,
    getHuminizeTimeFromUnix
};
