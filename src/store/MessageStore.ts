import { types } from "mobx-state-tree";

/**
 * 全局配置
 */
const MessageStore = types
  .model({
    /**
     * 是否正在获取 gpt 的消息
     * 连接阶段不算，直到输出流结束之后才结束
     */
    isFetchingMsg: types.optional(types.boolean, false),

    /**
     * 是否正在连接网络请求
     * 发起请求到响应之间的间隔，只要开始响应该状态就结束
     */
    isConnecting: types.optional(types.boolean, false),
  })
  .actions((self) => ({
    setIsFetchingMsg(isFetch: boolean) {
      self.isFetchingMsg = isFetch;
    },
    setIsConnecting(isConnecting: boolean) {
      self.isConnecting = isConnecting;
    }
  }));

const messageStore = MessageStore.create({
  isFetchingMsg: false,
  isConnecting: false
});

export default messageStore;