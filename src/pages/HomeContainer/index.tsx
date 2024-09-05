import React, { useEffect, useRef, useState } from "react";
import './index.scss';
import { NavigateFunction, Outlet, useNavigate } from "react-router-dom";
import SideBarHeader from "../SideBar/SideBarHeader";
import SideBarBody from "../SideBar/SideBarBody";
import SideBarFooter from "../SideBar/SideBarFooter";
import { IChatCardProps, IChatMessage, Role, Sender } from "@/components/ChatCard";
import { IChatProps } from "../Window/Chat";
import { ISettingProps } from "../Window/Setting";
import classNames from "classnames";
import _ from "lodash";
import localforage from "localforage";
import { CHAT_HOW_CAN_I_HELP_U, CHAT_LIST_KEY } from "@/constants";
import { message } from "antd";
import { v4 as uuidv4 } from 'uuid';
import messageStore from "@/store/MessageStore";
import { completionNonStream, completionStream, getChatTitle } from "@/utils/request";
import { CompletionMessage } from "@/utils/type";
import { observer } from "mobx-react-lite";
import { inject } from "mobx-react";
import globalStore from "@/store/globalStore";

const NEW_CHAT_TITLE = '新的聊天';

/**
 * 初始化时和清空时自动生成一条新的聊天
 * 使得 chatList 永远不为空数组
 * 
 * 此处必须为一个方法，否则后续调用将不再生成新的对象
 */
const createChatCard = (): IChatCardProps => {
  return ({
    id: uuidv4(),
    title: NEW_CHAT_TITLE,
    messageList: [createMessage()],
  });
};

/**
 * 创建一条消息
 * @param content 消息内容
 * @param sender 发送人
 */
export const createMessage = (
  content?: string,
  sender?: Sender,
): IChatMessage => {
  return ({
    content: content ?? CHAT_HOW_CAN_I_HELP_U,
    time: new Date(),
    sender: sender ?? Sender.ASSISTANT,
    fingerprint: uuidv4(),
  });
};

const handleNavigate = (
  nav: NavigateFunction,
  path: string,
) => {
  // navigate to specific path
  nav(path);
}

/**
 * 初始化 chat card list
 * 从本地缓存获取，无缓存则新建一个
 */ 
const initialChatList = [createChatCard()];

const HomeContainer: React.FC = () => {

  const nav = useNavigate();

  /**
   * 当前选中的 chat card，传递给 body 显示聊天记录
   */
  const [selectedIdx, setSelectedIdx] = useState(0);

  /**
   * chat card 列表
   * 每个 card 中存放了该聊天的所有对话记录
   */
  const [chatList, setChatList] = useState<IChatCardProps[]>([]);

  /**
   * 是否为全屏模式
   */
  const [isFullScreen, setIsFullScreen] = useState(false);

  /**
   * 是否显示编辑弹窗
   */
  const [isShowEditModal, setIsShowEditModal] = useState(false);

  /**
   * antd 消息提示
   */
  const [messageApi, contextHolder] = message.useMessage();

  /**
   * 聊天记录的引用，需要在流式输出中的每个 chunk 到来时获取最新的列表
   */
  const latestChatListRef = useRef<IChatCardProps[]>();

  // 加载聊天记录 
  useEffect(() => {
    localforage
      .getItem(CHAT_LIST_KEY)
      .then(chatData => {
        if (chatData) {
          setChatList(chatData as IChatCardProps[]);
        } else {
          setChatList(initialChatList);
        }
      });
  }, []);

  // 监听快捷键
  // 这里必须要依赖 chatList，否则无法拿到最新的 chatList 值
  // 1. 如果不依赖 chatList，useEffect 中的回调函数是基于首次渲染时创建的闭包
  // 闭包捕获的是创建时的值，后续由于无依赖项也不会再次执行 useEffect，也不会重新创建闭包
  // 因此也不会更新 chatList 的值
  // 2. 而外部由于每次组件渲染都会重新执行整个函数组件，因此外部能够获取最新的值
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        // 保存聊天记录
        localforage
          .setItem(CHAT_LIST_KEY, chatList)
          .then(() => {
            messageApi.open({
              type: 'success',
              content: '聊天记录保存成功',
            });
          })
          .catch(e => {
            console.log(`聊天记录保存失败 ${e}`);
            messageApi.open({
              type: 'error',
              content: `哎呀，出错了~请稍后再试 ${e}`,
            });
          });
      }
    }
    window.addEventListener('keydown', handleKeyDown);  

    return (() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  }, [chatList]);

  /**
   * 删除一个 chat card
   * @param index 要删除的 item index
   */
  const handleClickDelete = (index: number) => {
    if (!chatList) {
      return;
    }
    let newChatList: IChatCardProps[];
    if (chatList.length <= 1) {
      newChatList = [createChatCard()];
    } else {
      // 不能用 splice，这个方法会直接修改原数组 
      newChatList = [
        ...chatList.slice(0, index), 
        ...chatList.slice(index + 1)
      ];
    }
    // 当前选中的被删了，选中第一个
    if (index === selectedIdx) {
      setSelectedIdx(0);
    } else if (index < selectedIdx) {
      // 删除的 idx 在选中项之前，选中的 idx 要前移
      setSelectedIdx(selectedIdx - 1);
    }
    setChatList(newChatList);
  };
  
  /**
   * 新增一个 chat card
   * 新增的 item 加在数组 index 0 位置
   * 自动选中新增的 item
   */
  const handleClickNewChat = async () => {
    if (!chatList) {
      setChatList([createChatCard()]);
      return;
    }
    // 不能用 push 或 unshift，这两个方法会直接修改原数组
    const card = createChatCard();

    // mock data
    if (globalStore.isMockingData) {
      const mockData = await fetchMockData();
      card.messageList = mockData as IChatMessage[];
    }

    const newChatList = [card, ...chatList];
    setChatList(newChatList);
    setSelectedIdx(0);
  };

  /**
   * 切换选中的 chat card
   */
  const handleClickCard = (index: number) => {
    setSelectedIdx(index);
  };

  /**
   * 切换全屏模式
   */
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  /**
   * 编辑 chat card 弹窗
   */
  const handleClickEdit = () => {
    setIsShowEditModal(!isShowEditModal);
  };

  /**
   * 输入区域点击发送按钮
   */
  const handleClickSendMessage = (message: string) => {
    // 将最新的用户消息放入聊天列表
    const newMyChatList = chatList ? _.cloneDeep(chatList) : [createChatCard()];
    const newMyMessageList = [...newMyChatList[selectedIdx].messageList, createMessage(message, Sender.USER)];
    newMyChatList[selectedIdx].messageList = newMyMessageList;

    // ai 静音
    if (globalStore.isMuteAssistant) {
      setChatList(newMyChatList);
      return;
    }

    // 剔除第一条自动生成的消息
    // 将当前 chatList 的倒数 5 条消息作为 prompts
    const prompts = newMyMessageList
      .slice(1)
      .slice(-5)
      .map(chat => {
        return {
          role: Role[chat.sender],
          content: chat.content,
        } as CompletionMessage;
      });

    // 将即将生成的 gpt 回答消息放入聊天列表
    const assistMessage = createMessage("", Sender.ASSISTANT)
    newMyMessageList.push(assistMessage);
    setChatList(newMyChatList);

    // 标记当前最新的 chatList，后续回调时需要使用
    latestChatListRef.current = newMyChatList;

    messageStore.setIsConnecting(true);
    
    let gptMessage = '';
    const decoder = new TextDecoder('utf-8');
    completionStream(prompts)
      .then(res => {
        messageStore.setIsConnecting(false);
        messageStore.setIsFetchingMsg(true);

        const reader = res.body?.getReader();
        return new Promise<void>((resolve, reject) => {
          const OUT_LENGTH = 4; // 每次输出字符/单词个数

          // 接收并处理 chunk
          const processChunk = ({ done, value }: any) => {
            if (done) {
              messageStore.setIsFetchingMsg(false);
              resolve(); // 流完成后，resolve当前的Promise
              requestForTitle();
              return;
            }
            
            // 解码当前的 chunk
            const chunk = decoder.decode(value, { stream: true });
            // 将 chunk 分割为一个单词或一个汉字
            const characters = chunk.split(/(?=[\s\S])/u);

            // 异步递归输出流
            // 需要的动态参数：1. 输出字符长度；2. 流输出延时
            const asyncRecursiveOutStream = (index = 0) => {
              if (index < characters.length) {
                // 剩余长度足够那就输出，否则剩余多少输出多少
                const actualOutputLength = Math.min(OUT_LENGTH, characters.length - index);
                // const delay = weightedDelayPerChar * actualOutputLength;

                const outputChunk = characters.slice(index, index + actualOutputLength).join('');
                gptMessage += outputChunk;
                assistMessage.content = gptMessage;

                // 更新 UI
                requestAnimationFrame(() => {
                  const updatedChatList = latestChatListRef.current ? _.cloneDeep(latestChatListRef.current) : [createChatCard()];
                  setChatList(updatedChatList);
                });

                // 使用 setTimeout 递归调用下一个片段
                setTimeout(() => asyncRecursiveOutStream(index + actualOutputLength), 100);
              } else {
                reader!.read().then(processChunk).catch(reject);
              }
            }

            asyncRecursiveOutStream();
          }

          // 开始读取 chunk
          reader!.read().then(processChunk).catch(reject);
        });
      })
      .catch(e => {
        assistMessage.content = e.message;
        const updatedChatList = latestChatListRef.current ? _.cloneDeep(latestChatListRef.current) : [createChatCard()];
        setChatList(updatedChatList);

        messageApi.open({
          type: 'error',
          content: '出错了~稍后再试试吧',
        });
        console.log(e);
      })
      .finally(() => {
        messageStore.setIsConnecting(false);
        messageStore.setIsFetchingMsg(false);
      });
  };

  /**
   * 请求标题
   */
  const requestForTitle = () => {
    if (!latestChatListRef.current) {
      return;
    }
    if (chatList[selectedIdx].title === NEW_CHAT_TITLE) {
      const titlePrompt = latestChatListRef
        .current[selectedIdx]
        .messageList
        .slice(1)
        .map(chat => {
          return {
            role: Role[chat.sender],
            content: chat.content,
          } as CompletionMessage;
        });

      messageStore.setIsFetchingMsg(true);
      getChatTitle(titlePrompt)
        .then(res => {
          const title: string = res.data;
          if (latestChatListRef.current) {
            latestChatListRef.current[selectedIdx].title = '';
            typeTitle(title);
          }
        })
        .catch(e => {
          // do nothing
        })
        .finally(() => {
          messageStore.setIsFetchingMsg(false);
        });
    }
  }

  /**
   * web worker 模拟大数据
   * @returns mock data
   */
  const fetchMockData = () => {
    messageApi.open({
      type: 'info',
      content: 'Web Worker Mocking Data...',
    });
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./mockworker.js', import.meta.url));
      worker.onmessage = (event) => {
        resolve(event.data);
        messageApi.success({
          type: 'success',
          content: `${event.data.length} Messages Mocked`,
        });
        worker.terminate();
      };
      worker.onerror = (error) => {
        reject(error);
      }
      worker.postMessage({ n: globalStore.mockDataNum, t: globalStore.mockDataType });
    });
  }

  /**
   * 异步递归模拟打字机打印标题
   */
  const typeTitle = (title: string, index: number = 0) => {
    if (index < title.length) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (latestChatListRef.current) {
            latestChatListRef.current[selectedIdx].title += title[index];
            setChatList([...latestChatListRef.current]);
            typeTitle(title, index + 1);
          }
        });
      }, 150);
    }
  }

  /**
   * 二级路由 chat 参数
   */
  const chatParam: IChatProps = {
    chatCardProps: chatList[selectedIdx],
    isFullScreen: isFullScreen,
    handleToggleFullScreen: handleToggleFullScreen,
    handleClickEdit: handleClickEdit,
    handleClickSendMessage: handleClickSendMessage,
  };

  /**
   * 二级路由 setting 参数
   */
  const settingParam: ISettingProps = {
  };

  return (
    <>
      {contextHolder}
      <div className={
        classNames(
          'home', 
          {'full-screen': isFullScreen},
        )}
      >
        {/* 面板区域 */}
        <div className="home-side-bar-container">
          <SideBarHeader />
          <SideBarBody 
            chatList={chatList}
            selectedIdx={selectedIdx}
            handleClickDelete={handleClickDelete}
            handleClickCard={handleClickCard}
            handleClickBody={() => handleNavigate(nav, '/')}
          />
          <SideBarFooter
            handleClickSetting={() => handleNavigate(nav, '/setting')} 
            handleClickNewChat={handleClickNewChat}
          />
        </div>
        <div className="home-chat-container">
          {/* 渲染二级路由的地方 */}
          <Outlet
            // 将当前选中的 chat card 进行传递
            context={chatParam}
          />
        </div>

        {/* 弹窗区域 */}
        {isShowEditModal && 
          <div className="home-chat-edit-modal-mask">
            <div className="home-chat-edit-modal">

            </div>
          </div>
        }
      </div>
    </>
  )
};

export default inject("globalStore", "messageStore")(observer(HomeContainer));