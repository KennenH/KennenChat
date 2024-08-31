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
     * 是否使用流式输出
     */
    isUseStream: types.optional(types.boolean, true),

    /**
     * 温度
     */
    temperature: types.optional(types.number, 0.95),

    /**
     * 多样性
     */
    top_p: types.optional(types.number, 0.7),

    /**
     * 惩罚因子
     */
    penalty_score: types.optional(types.number, 1.0),

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
    shouldUseStream(stream: boolean) {
      self.isUseStream = stream;
    },
    setTemperature(t: number) {
      self.temperature = t;
    },
    setTopP(tp: number) { 
      self.top_p = tp;
    },
    setPenaltyScore(score: number) {
      self.penalty_score = score;
    },
    loadConfigFromStorage: flow(function* () {
      const config = yield localforage.getItem("appConfig");
      if (config) {
        self.isDarkMode = config.isDarkMode;
        self.isUseVirtualList = config.isUseVirtualList;
        self.isMuteAssistant = config.isMuteAssistant;
        self.isParseMarkdown = config.isParseMarkdown;
        self.isUseStream = config.isUseStream;
        self.temperature = config.temperature;
        self.top_p = config.top_p;
        self.penalty_score = config.penalty_score;
      }
    }),
  }));

const globalStore = GlobalStore.create({});

globalStore.loadConfigFromStorage();

export default globalStore;