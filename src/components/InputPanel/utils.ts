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
  '：v' : () => {
    switchVirtual(true);
  },
  /**
   * 切换非虚拟列表
   */
  ':nv': () => {
    switchVirtual(false);
  },
  '：nv': () => {
    switchVirtual(false);
  }
};

/**
 * 切换虚拟列表
 * @param virtual 是否虚拟列表
 */
const switchVirtual = (virtual: boolean) => {
  store.switchVirtualList(virtual);
}

/**
 * 执行命令
 * @param inputText 命令
 */
const exeCmd = (inputText: string): boolean => {
  const func = cmds[inputText];
  func?.();
  return func !== undefined ? true : false;
}

export default exeCmd;