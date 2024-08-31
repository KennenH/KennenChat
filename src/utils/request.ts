import axios from "axios";
import { CompletionBody, CompletionMessage } from "./type";
import globalStore from "@/store/globalStore";

const request = axios.create({
  baseURL: 'http://localhost:8008',
  timeout: 30000,
});

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 非流式响应
 */
const completionNonStream = (messages: CompletionMessage[]) => {
  const requestBody: CompletionBody = {
    messages,
    temperature: globalStore.temperature,
    top_p: globalStore.top_p,
    penalty_score: globalStore.penalty_score,
  }
  return request.post('/api/next-chat/completion/nonstream', requestBody);
}

/**
 * 流式响应
 */
const completionStream = (messages: CompletionMessage[]) => {
  const requestBody: CompletionBody = {
    messages,
    temperature: globalStore.temperature,
    top_p: globalStore.top_p,
    penalty_score: globalStore.penalty_score,
  }
  return fetch('http://localhost:8008/api/next-chat/completion/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
}

export { 
  request,
  completionNonStream,
  completionStream
};