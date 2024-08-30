import store from "@/store/globalStore";

interface ICMD {
  [key: string]: () => void | undefined,
}

const cmds: ICMD = {
  /**
   * 切换虚拟列表
   */
  ':v': () => {
    switchVirtual(true);
  },
  /**
   * 切换非虚拟列表
   */
  ':nv': () => {
    switchVirtual(false);
  },
  /**
   * 静音 ai
   */
  ':m': () => {
    muteAi(true);
  },
  /**
   * 解除 ai 静音
   */
  ':um': () => {
    muteAi(false);
  },
  /**
   * 解析 markdown
   */
  ':p': () => {
    switchParseMarkdown(true);
  },
  /**
   * 不解析 markdown
   */
  ':np': () => {
    switchParseMarkdown(false);
  }
};

const switchVirtual = (virtual: boolean) => {
  store.switchVirtualList(virtual);
}

const muteAi = (mute: boolean) => {
  store.shouldMuteAssistant(mute);
}

const switchParseMarkdown = (parse: boolean) => {
  store.shouldParseMarkdown(parse);
}

/**
 * 执行命令
 * @param inputText 命令
 */
const exeCmd = (inputText: string): boolean => {
  inputText = inputText.replace('：', ':');
  const func = cmds[inputText];
  func?.();
  return func !== undefined ? true : false;
}

export default exeCmd;