import store from "@/store/globalStore";

interface ICMD {
  [key: string]: {
    desc: string,
    fun: (args?: any) => void | undefined,
    argsDesc?: { [key: string]: string },
  },
}

interface ParsedCMD {
  command: string,
  args?: { [key: string]: string },
}

interface MockArgs {
  n?: string
}

const cmds: ICMD = {

  ':v': {
    desc: '是否使用虚拟列表',
    fun: () => switchVirtual(!store.isUseVirtualList),
  },

  ':mute': {
    desc: 'ai 静音，静音后若发送消息该聊天将不再可用',
    fun: () => muteAi(!store.isMuteAssistant),
  },

  ':p': {
    desc: '是否解析 Markdown',
    fun: () => switchParseMarkdown(!store.isParseMarkdown),
  },

  ':mock': {
    desc: '开启之后点击\'新的聊天\'将生成指定数量的消息',
    fun: function (args: MockArgs) {
      switchMockData(args?.n)
    },
    argsDesc: {
      'n': '指定要 Mock 的数量，默认为 10000'
    }
  },

  ':h': {
    desc: '帮的并不是很助，ctrl + s 保存聊天记录',
    fun: () => {
      outputHelp();
    }
  }
};

const switchVirtual = (virtual: boolean) => {
  store.switchVirtualList(virtual);
  console.log(`~kennen-tag: CMD executed - 虚拟列表 - Enabled:${virtual}`);
}

const muteAi = (mute: boolean) => {
  store.shouldMuteAssistant(mute);
  console.log(`~kennen-tag: CMD executed - ai 静音，静音后若发送消息该聊天将不再可用 - Enabled:${mute}`);
}

const switchParseMarkdown = (parse: boolean) => {
  store.shouldParseMarkdown(parse);
  console.log(`~kennen-tag: CMD executed - 解析 markdown - Enabled:${parse}`);
}

const switchMockData = (num?: string) => {
  if (num) {
    store.setIsMockingData(true);
    store.setMockDataNum(Number(num));
  } else {
    store.setIsMockingData(!store.isMockingData);
  }
  console.log(`~kennen-tag: CMD executed - Mock Data - Enabled:${store.isMockingData} - Num:${num ?? store.mockDataNum}`);
}

const outputHelp = () => {
  let helpInfo = [];
  for (const key in cmds) {  
    if (cmds.hasOwnProperty(key)) {  
      const { desc, argsDesc } = cmds[key];  
      let paramsInfo = '';
      for (let p in argsDesc) {
        paramsInfo += `[-${p}: ${argsDesc?.[p] ?? ''}]`
      }
      helpInfo.push(`${key} ${paramsInfo ? `${paramsInfo}` : ''} ${desc}。`);  
    }  
  }
  console.log(helpInfo.join('\n\n'));
}

/**
 * 解析参数
 * @param inputText 输入的命令字符串
 * @returns {command: string, args: {[key: string]: string}}
 */
const parseInput = (inputText: string): ParsedCMD => {
  const parts = inputText.replace('：', ':').trim().split(' ');
  const command = parts[0];
  const args: { [key: string]: string } = {};
  if ((parts.length - 1) % 2 !== 0) {
    throw new Error('illegal state');
  }
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const value = parts[i + 1];
    if (key.startsWith('-')) {
      args[key.substring(1)] = value;
    } else {
      throw new Error(`unexpected param '${key}', did you mean '-${key}'?`);
    }
  }

  return { command, args };
};

/**
 * 执行命令
 * @param inputText 命令
 */
const exeCmd = (inputText: string): boolean => {
  try {
    const { command, args} = parseInput(inputText);
    cmds[command]?.fun?.(args)
  } catch (e: any) {
    console.log(`~kennen-tag ${e.message}`);
  }
  return inputText.startsWith(':') || inputText.startsWith('：');
}

export default exeCmd;