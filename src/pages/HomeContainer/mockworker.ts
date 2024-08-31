/**
 * 用于生成 mock data，检测虚拟列表性能
 */
import { IChatMessage, Sender } from "@/components/ChatCard";
import { createMessage } from "@/pages/HomeContainer";


self.onmessage = () => {  
  console.log('~kennen-tag mocking data...');
  const mockData: IChatMessage[] = [];
  let flag = true;
  for (let i = 0; i < 10000; i++) {
    mockData.push(createMessage(i.toString(), flag ? Sender.USER : Sender.ASSISTANT));
    flag = !flag;
  }
  console.log('~kennen-tag mock done');
  self.postMessage(mockData);
};  