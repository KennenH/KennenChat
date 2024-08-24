/**
 * 虚拟列表
 * 
 * 1. 估算所有子 item 的总高度，撑开滚动条
 * 2. 找到真正需要渲染的子 item 的 index 并在正确的偏移处渲染它们
 *    - 由于聊天列表必然是从底部开始往上拉的，所以最后一个 item 的 bottom 为 0
 *    - 对于在任意位置的子 item，都可以通过它下方的子 item 的偏移和高度相加进行计算
 *    
 *    -> 列表在往上滚动的过程中计算沿途的子 item 的 bottom 和高度，并作为后续子 item 的位置计算的基础
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './index.scss';
import { IChatCardProps, IChatMessage } from '../ChatCard';
import Message from '../Message';
import _ from 'lodash';
import measuredData from './MeasuredData';

interface IKVirtualListProps {
  messages: IChatMessage[],
  chatCardId: string,
}

const KVirtualList: React.FC<IKVirtualListProps> = (
  props: IKVirtualListProps
) => {

  const {
    messages,
    chatCardId
  } = props;

  /**
   * 列表的真实高度，外部列表的高度
   * 
   * flex：1，撑满父容器的剩余空间
   */
  const [listRealHeight, setListRealHeight] = useState(500);

  /**
   * 列表的虚拟高度，内部列表的高度，用于撑开滚动条
   * 
   * 初始化为 item 数量 * item 的预估高度
   */
  // const [listVirtualHeight, setListVirtualHeight] = useState(listRealHeight);

  /**
   * 聊天记录需从底部开始滑动
   * 因此滑动过的距离应该是：列表总高度 H - scrollTop - 可视窗口高度 height
   */
  const [scrolledOffset, setScrolledOffset] = useState(0);

  /**
   * 最外层 div 的引用
   */
  const virtualListRef = useRef<HTMLDivElement>(null);

  /**
   * 记录当前聊天的聊天 id
   * 
   * 当聊天 id 不一致时切换 measuredData
   */
  const chatId = useRef('');

  /**
   * 聊天记录改变时
   * 1. 切换聊天
   *    - 手动执行渲染（不滚动不会触发渲染）
   * 2. 聊天有新消息
   *    - 重新估算虚拟列表高度，只需要先前的高度加上新消息的预估高度
   */
  useEffect(() => {
    if (!messages) {
      return;
    }
    console.log('kennen 更新聊天', chatCardId, chatId.current);
    // const measuredDataInfo = measuredData.useMeasuredDataInfo[chatCardId]();
    // 同一个聊天，有新消息
    if (chatId.current === chatCardId) {
      measuredData.updateOnNewMessage(chatCardId, messages.length);
    } else { // 切换聊天
      chatId.current = chatCardId;
    }
  }, [messages]);

  /**
   * 监听虚拟列表自身真实高度
   */
  useEffect(() => {
    const throttledResizeCallback = _.throttle(entries => {
      const { height } = entries[0].contentRect;
      setListRealHeight(height);
    }, 1000, { leading: false, trailing: true });

    const resizeObserver = new ResizeObserver(throttledResizeCallback);

    if (virtualListRef.current) {  
      resizeObserver.observe(virtualListRef.current);  
    }  
  
    return () => {  
      if (virtualListRef.current) {  
        resizeObserver.unobserve(virtualListRef.current);  
      }  
    };  
  }, []);

  /**
   * 滑动至底部
   */
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, chatCardId]);

  /**
   * 虚拟列表滚动至底部
   */
  const scrollToBottom = () => {
    if (virtualListRef.current) {
      const { listVirtualHeight } = measuredData.useMeasuredDataInfo[chatCardId]();
      virtualListRef.current.scrollTop = virtualListRef.current.scrollHeight - listRealHeight;
    }
  }

  const throttledGetRenderMessageList = _.throttle(() => {
    return getRenderMessageList();
  }, 300, { leading: true, trailing: true });

  /**
   * 实例化真正需要渲染的 item
   * 
   * @returns 需要渲染的 item 的列表
   */
  const getRenderMessageList = () => {
    if (!messages) {
      return;
    }
    const measuredDataInfo = measuredData.useMeasuredDataInfo[chatCardId]();
    const [startIndex, endIndex] = measuredData.getRenderIndex(
      messages.length,
      listRealHeight,
      scrolledOffset,
      measuredDataInfo,
    );
    const messageList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const bottom = measuredData.getMesuredData(i, measuredDataInfo).offset;
      const itemStyles = {
        position: 'absolute',
        bottom: bottom,
      };
      messageList.push(
        <Message 
          key={messages[i].fingerprint}
          message={messages[i]}
          onSizeChanged={offsetHeight => measuredData.onChildSizeChanged(i, offsetHeight, measuredDataInfo, messages)}
          styles={itemStyles}
        />
      );
    }
    return messageList;
  }

  const throttledScroll = _.throttle(() => {
      if (virtualListRef.current) {
        const listVirtualHeight = measuredData.useMeasuredDataInfo[chatCardId]().listVirtualHeight;
        setScrolledOffset(listVirtualHeight - virtualListRef.current.scrollTop - listRealHeight);
      }
    }, 500, { leading: true, trailing: true }
  );

  const listVirtualHeight = measuredData.useMeasuredDataInfo[chatCardId](messages.length).listVirtualHeight;

  return (
    <div 
      className='v-list-container'
      onScroll={throttledScroll}
      ref={virtualListRef}
    >
      <div
        className='v-list-inner-container'
        style={{ height: listVirtualHeight }}
      >
        {throttledGetRenderMessageList()}
      </div>
    </div>
  );
};

export default KVirtualList;