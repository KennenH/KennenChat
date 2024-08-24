import { useOutletContext } from 'react-router-dom';
import './index.scss';
import WindowHeader, { WindowHeaderActionConfig, WindowHeaderTitleConfig } from '@/components/WindowHeader';
import { IChatCardProps } from '@/components/ChatCard';
import Message from '@/components/Message';
import InputPanel from '@/components/InputPanel';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import KVirtualList from '@/components/KVirtualList';
import globalStore from '@/store/globalStore';
import { inject, observer } from 'mobx-react';

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
const Chat: React.FC = (
  // props: IChatProps,
) => {

  const { 
    chatCardProps,
    isFullScreen,
    handleToggleFullScreen,
    handleClickEdit,
    handleClickSendMessage,
  } = useOutletContext() as IChatProps;

  // const { 
  //   chatCardProps,
  //   isFullScreen,
  //   handleToggleFullScreen,
  //   handleClickEdit,
  //   handleClickSendMessage,
  // } = props;

  // 非虚拟列表引用
  const noneVirtualMessageListRef = useRef<HTMLDivElement>(null);

  // 当非虚拟列表消息变化时滚动至底部
  useEffect(() => {
    console.log('kennen chat 层 useEffect');
    scrollToBottom(noneVirtualMessageListRef.current);
  }, [chatCardProps?.messageList]);

  const titleConfig: WindowHeaderTitleConfig = { 
    primaryTitle: chatCardProps?.title ?? '新的聊天',
    secondaryTitle: `共 ${(chatCardProps?.messageList.length ?? 1) - 1} 条对话`,
    isPrimaryTitleClickable: true,
    handleClickPrimaryTitle: handleClickEdit,
  };

  const actionConfigs: WindowHeaderActionConfig[] = [
    {
      iconName: 'edit',
      handleClickAction: () => handleClickEdit(),
    },
    {
      iconName: isFullScreen ? 'fullscreen-exit' : 'fullscreen',
      handleClickAction: () => handleToggleFullScreen(),
    },
  ];

  const messageData = globalStore.isUseVirtualList ?
    null : 
    chatCardProps
      ?.messageList
      .map(msg => {
        return (
          <Message
            key={msg.fingerprint}
            message={msg}
          />
        );
      });

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
            chatCardProps={chatCardProps}
            // chatCardId={chatCardProps?.id}
            // messages={chatCardProps?.messageList}
          />
        ) :
        (
          <div 
            ref={noneVirtualMessageListRef}
            className='chat-body'>
            {messageData}
          </div>
        )
      }
      <InputPanel
        handleClickSendMessage={handleClickSendMessage}
        onTextAreaFocused={() => scrollToBottom(noneVirtualMessageListRef.current)}
      />
    </>
  );
};

export default inject("globalStore")(observer(Chat));