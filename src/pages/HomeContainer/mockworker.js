/**
 * 用于生成 mock data，检测虚拟列表性能
 */
import { Sender } from "@/components/ChatCard";
import { createMessage } from "@/pages/HomeContainer";


onmessage = (param) => {  
  console.log('~kennen-tag mocking data...');
  const mockData = [];
  let flag = true;
  const mockNum = param.data;
  for (let i = 0; i < mockNum; i++) {
    mockData.push(createMessage(i.toString(), flag ? Sender.USER : Sender.ASSISTANT));
    flag = !flag;
  }
  console.log('~kennen-tag mock done');
  postMessage(mockData);
};  