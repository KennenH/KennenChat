import { types, Instance, flow } from "mobx-state-tree";
import localforage from "localforage";

/**
 * 全局配置
 */
const GlobalStore = types
  .model({
    /**
     * 暗黑模式
     */
    isDarkMode: types.optional(types.boolean, false),
    /**
     * 是否使用虚拟列表
     */
    isUseVirtualList: types.optional(types.boolean, true)
  })
  .actions((self) => ({
    setDarkMode(value: boolean) {
      self.isDarkMode = value;
    },
    switchVirtualList(virtual: boolean) {
      self.isUseVirtualList = virtual;
    },
    loadConfigFromStorage: flow(function* () {
      const config = yield localforage.getItem("appConfig");
      if (config) {
        self.isDarkMode = config.isDarkMode;
        self.isUseVirtualList = config.isUseVirtualList;
      }
    }),
  }));

const globalStore = GlobalStore.create({});

globalStore.loadConfigFromStorage();

export default globalStore;