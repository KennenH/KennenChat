import axios from "axios";
import { getTokenLocal } from "./token";
import { CompletionMessage } from "./type";

const request = axios.create({
  baseURL: 'http://localhost:8008',
  timeout: 30000,
});

// request.interceptors.request.use(
//   (config) => {
//     const token = getTokenLocal();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

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
const completion = (prompts: CompletionMessage[]) => {
  return request.post('/api/next-chat/completion/nonstream', prompts);
}

/**
 * 流式响应
 */
const completionStream = (prompts: CompletionMessage[]) => {
  return fetch('http://localhost:8008/api/next-chat/completion/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prompts)
  });
}

export { 
  request,
  completion,
  completionStream
};