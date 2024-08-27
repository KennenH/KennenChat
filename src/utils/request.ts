import axios from "axios";
import { getTokenLocal } from "./token";

const request = axios.create({
  baseURL: 'http://localhost:8008',
  timeout: 10000
});

request.interceptors.request.use(
    (config) => {
        const token = getTokenLocal();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export { request };