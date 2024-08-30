import { types, flow } from "mobx-state-tree";
import localforage from "localforage";

/**
 * 全局配置
 */
const GlobalStore = types
  .model({
    /**
     * 暗黑模式
     */
    isDarkMode: types.optional(types.boolean, true),

    /**
     * 是否使用虚拟列表
     */
    isUseVirtualList: types.optional(types.boolean, true),

    /**
     * ai 静音
     */
    isMuteAssistant: types.optional(types.boolean, false),

    /**
     * 是否解析 markdown
     */
    isParseMarkdown: types.optional(types.boolean, true),
  })
  .actions((self) => ({
    setDarkMode(value: boolean) {
      self.isDarkMode = value;
    },
    switchVirtualList(virtual: boolean) {
      self.isUseVirtualList = virtual;
    },
    shouldMuteAssistant(mute: boolean) {
      self.isMuteAssistant = mute;
    },
    shouldParseMarkdown(parse: boolean) {
      self.isParseMarkdown = parse;
    },
    loadConfigFromStorage: flow(function* () {
      const config = yield localforage.getItem("appConfig");
      if (config) {
        self.isDarkMode = config.isDarkMode;
        self.isUseVirtualList = config.isUseVirtualList;
        self.isMuteAssistant = config.isMuteAssistant;
        self.isParseMarkdown = config.isParseMarkdown;
      }
    }),
  }));

const globalStore = GlobalStore.create({});

globalStore.loadConfigFromStorage();

export default globalStore;