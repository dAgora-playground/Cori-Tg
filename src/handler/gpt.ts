import {
    Configuration,
    OpenAIApi,
    ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { config } from "../config/index.js";

export interface Activity {
    topic: string;
    time: string;
    location: string;
}

export async function gptRequest(msgContent: string) {
    let result: Activity = {
        topic: "",
        time: "",
        location: "",
    };

    if (!msgContent) return null;

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const apiRequestConfig = {
        proxy: {
            host: "127.0.0.1",
            port: 7890,
        },
    };

    // Add time zone offset (in hours) and get local time
    const targetTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: config.timeZone })
    );

    // Format date
    const date = targetTime.toISOString().split("T")[0];

    // getDay
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const day = targetTime.getDay();
    const todayDay = days[day];

    const request_message = `
        [information] ${msgContent} \n Today is ${todayDay}, ${date}. 
        [instruction] Assume you are in timezone ${config.timeZone}. Summarize the topic, generate start date time (in ISO format) and location(room like Dorm, G100, or some website etc or not decided) from the activity info.
        Reply must be json format. No other words.
        [output json format]{
            topic:
            time: 
            location: 
        }
        [assistant]
    `;
    const params = {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: ChatCompletionRequestMessageRoleEnum.System,
                content: "You're a calendar assistant.",
            },
            {
                role: ChatCompletionRequestMessageRoleEnum.User,
                content: request_message,
            },
        ],
        temperature: 0.3,
    };

    try {
        // 墙内测试时
        // const response = await openai.createChatCompletion(
        //     params,
        //     apiRequestConfig
        // );
        // 墙外服务器
        const response = await openai.createChatCompletion(params);

        let content = response.data.choices[0]?.message?.content;
        try {
            const gptResult = JSON.parse(content || "{}");
            result.topic = gptResult?.topic ?? null;
            result.time = gptResult?.time ?? null;
            result.location = gptResult?.location ?? null;
        } catch (error) {
            console.error(error);
            console.log(content);
        }
    } catch (error) {
        console.error(error);
    }
    return result;
}
