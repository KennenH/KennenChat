import store from "@/store/globalStore";

interface ICMD {
  [key: string]: () => void | undefined,
}

const cmds: ICMD = {
  /**
   * 虚拟列表
   */
  ':v': () => {
    switchVirtual(!store.isUseVirtualList);
  },
  /**
   * 静音 ai
   */
  ':mute': () => {
    muteAi(!store.isMuteAssistant);
  },
  /**
   * 解析 markdown
   */
  ':p': () => {
    switchParseMarkdown(!store.isParseMarkdown);
  },
  /**
   * mock data
   */
  ':mock': () => {
    switchMockData(!store.isMockingData);
  }
};

const switchVirtual = (virtual: boolean) => {
  store.switchVirtualList(virtual);
  console.log(`~kennen-tag: cmd executed - 虚拟列表 - enable:${virtual}`);
}

const muteAi = (mute: boolean) => {
  store.shouldMuteAssistant(mute);
  console.log(`~kennen-tag: cmd executed - ai 静音 - enable:${mute}`);
  console.warn(`~kennen-tag: ai 静音之后若在当前聊天发送过消息，则当前聊天将不再可用`);
}

const switchParseMarkdown = (parse: boolean) => {
  store.shouldParseMarkdown(parse);
  console.log(`~kennen-tag: cmd executed - 解析 markdown - enable:${parse}`);
}

const switchMockData = (mock: boolean) => {
  store.setIsMockingData(mock);
  console.log(`~kennen-tag: cmd executed - Mock Data - enable:${mock}`);
}

/**
 * 执行命令
 * @param inputText 命令
 */
const exeCmd = (inputText: string): boolean => {
  const func = cmds[inputText.replace('：', ':')]
  func?.();
  return func !== undefined ? true : false;
}

export default exeCmd;