import { useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';
import { IChatCardProps, Sender } from '@/components/ChatCard';
import Message from '@/components/Message';
import InputPanel from '@/components/InputPanel';
import { ReactNode, useEffect, useRef, useState } from 'react';
import KVirtualList from '@/components/KVirtualList';
import globalStore from '@/store/globalStore';
import { observer } from 'mobx-react';
import messageStore from '@/store/MessageStore';

export interface IChatProps {
  chatCardProps?: IChatCardProps,
  isFullScreen: boolean,
  handleToggleFullScreen: Function,
  handleClickEdit: Function,
  handleClickSendMessage: Function,
}

/**
 * 元素滚动至底部
 */
const scrollToBottom = (
  element: HTMLElement | null,
) => {
  if (!element) {
    return;
  }

  element.scrollTop = element.scrollHeight - element.clientHeight;
}

/**
 * chat 二级路由，参数无法从函数中直接获取
 * 需要使用 {@link useOutletContext} 获取
 */
const Chat: React.FC = observer((
  // props: IChatProps,
) => {

  const { 
    chatCardProps,
    isFullScreen,
    handleToggleFullScreen,
    handleClickEdit,
    handleClickSendMessage,
  } = useOutletContext() as IChatProps;

  const [noneVirtualData, setNoneVirtualData] = useState<ReactNode[]>([]);

  // 非虚拟列表引用
  const noneVirtualMessageListRef = useRef<HTMLDivElement>(null);

  // 虚拟列表引用
  const virtualMessageListRef = useRef<KVirtualList>(null);

  // 当非虚拟列表消息变化时滚动至底部
  useEffect(() => {
    scrollToBottom(noneVirtualMessageListRef.current);
  }, [chatCardProps?.messageList]);

  useEffect(() => {
    const messages = chatCardProps?.messageList;
    const data = !globalStore.isUseVirtualList && messages ?
      messages
        .map((msg, idx) => {
          const isNewestAiMsg = idx === messages.length - 1 
                && msg.sender === Sender.ASSISTANT;
          return (
            <Message
              key={msg.fingerprint}
              message={msg}
              isShowLoading={
                isNewestAiMsg && messageStore.isConnecting
              }
            />
          );
        })
      : [];
    setNoneVirtualData(data);
  }, [chatCardProps?.messageList]);

  const titleConfig: WindowHeaderTitleConfig = { 
    primaryTitle: chatCardProps?.title ?? '新的聊天',
    secondaryTitle: `共 ${(chatCardProps?.messageList.length ?? 1) - 1} 条对话`,
    isPrimaryTitleClickable: true,
    handleClickPrimaryTitle: handleClickEdit,
  };

  const actionConfigs: WindowHeaderActionConfig[] = [
    {
      iconName: isFullScreen ? 'fullscreen-exit' : 'fullscreen',
      handleClickAction: () => handleToggleFullScreen(),
    },
  ];

  /**
   * 输入区域获取焦点
   */
  const onInputAreaFocused = () => {
    // 非虚拟列表滚动至底部
    scrollToBottom(noneVirtualMessageListRef.current);
    // 虚拟列表滚动至底部
    virtualMessageListRef?.current?.scrollToBottom();
  }

  return (
    <>
      <WindowHeader
        titleConfig={titleConfig}
        actionConfigs={actionConfigs}
      />
      {
        globalStore.isUseVirtualList && chatCardProps ?
        (
          <KVirtualList
            ref={virtualMessageListRef}
            chatCardProps={chatCardProps}
          />
        ) :
        (
          <div 
            ref={noneVirtualMessageListRef}
            className='chat-body'>
            {noneVirtualData}
          </div>
        )
      }
      <InputPanel
        handleClickSendMessage={handleClickSendMessage}
        onTextAreaFocused={onInputAreaFocused}
      />
    </>
  );
});

export default Chat;