import { connect } from "http2";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";


export async function gptRequest(msgContent: string) {
    
    let result = {
        topic: null,
        time: null,
        location: null
    };

    if (!msgContent) return result;


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

    // Montenegro's time zone is GMT+2 
    const tzOffset = 2;  

    // Create Date object and get GMT time 
    const today = new Date(); 
    const utc = today.getTime() + (today.getTimezoneOffset() * 60 * 1000);

    // Add time zone offset (in hours) and get local Montenegrin time
    const montenegro = new Date(utc + 3600000*tzOffset);

    // Format date 
    const date = montenegro.toISOString().split('T')[0]; 

    // getDay
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = today.getDay(); 
    const todayDay = days[day];

    const request_message = `
        [information] ${msgContent} \n Today is ${todayDay}, ${date}. 
        [instruction] Summarize the topic, generate start time (including date) and location(room like G101, G102, etc or not decided) from the activity info. Reply in json only.
        [output json format]{
            topic:
            time: 
            location: 
        }
        [assistant]
    `
    const params = {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: ChatCompletionRequestMessageRoleEnum.System, content: "You're a calendar assistant." },
            { role: ChatCompletionRequestMessageRoleEnum.User, content: request_message }
        ],
        temperature: 0.3,
    };

    try {
        // 墙内测试时
        const response = await openai.createChatCompletion(params, apiRequestConfig);
        // 墙外服务器
        // const response = await openai.createChatCompletion(params);

        let content = response.data.choices[0]?.message?.content;
        try {
            const gptResult = JSON.parse(content || '{}');
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
    return result
}