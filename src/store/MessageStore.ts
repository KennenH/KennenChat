import { types } from "mobx-state-tree";

/**
 * 全局配置
 */
const MessageStore = types
  .model({
    /**
     * 是否正在获取 gpt 的消息
     */
    isFetchingMsg: types.optional(types.boolean, false)
  })
  .actions((self) => ({
    setIsFetchingMsg(isFetch: boolean) {
      self.isFetchingMsg = isFetch;
    }
  }));

const messageStore = MessageStore.create();

export default messageStore;