import { request } from "./request"
import { getTokenLocal, removeTokenLocal, setTokenLocal } from "./token"

// 中转工具，所有 utils 都经过该文件进行中转
export {
    request,
    setTokenLocal,
    removeTokenLocal,
    getTokenLocal
}