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
import React, { useEffect, useRef, useState } from 'react';
import './index.scss';
import { IChatMessage } from '../ChatCard';
import Message from '../Message';
import _ from 'lodash';

interface IKVirtualListProps {
  messages: IChatMessage[],
}

/**
 * 子 item 的测量数据
 */
interface MeasuredItem {
  /**
   * height：子 item 的真实高度
   * offset：bottom 偏移量
   */
  [key: number]: {height: number, offset: number}
}

/**
 * 已经测量的子 item 的缓存数据
 */
interface MeasuredDataInfo {
  /**
   * 所有已测量的子 item 缓存数据
   */
  measuredData: MeasuredItem,

  /**
   * 最上方的（最旧的）已经测量的子 item 的下标
   */
  topMostMeasuredIndex: number,
}

/**
 * 根据屏幕上已经渲染过的气泡取平均来估算整个列表的长度
 */
const getEstimatedItemHeight = () => {
  return 130;
}

/**
 * 已经计算好的子 item 的信息
 */
const measuredDataInfo: MeasuredDataInfo = {
  measuredData: {},
  topMostMeasuredIndex: -1,
};

/**
 * 获取对应下标的 item 高度和偏移
 * 
 * @param index 要获取测量数据的子 item 的下标
 * 
 * @returns 对应下标的子 item 的测量数据 {@link MeasuredItem}
 */
const getMesuredData = (index: number) => {
  const { measuredData, topMostMeasuredIndex } = measuredDataInfo;
  console.log(`kennen topMostMeasuredIndex ${topMostMeasuredIndex}`);
  if (index <= topMostMeasuredIndex) {
    let offset = 0;
    const topMostMeasuredItem = measuredData?.[topMostMeasuredIndex];
    console.log(`kennen topMostMeasuredItem ${topMostMeasuredItem}`);
    if (topMostMeasuredItem) {
      offset += topMostMeasuredItem.offset + topMostMeasuredItem.height;
    }
    // 从下到上计算没有被测量的 item 的位置
    for (let i = topMostMeasuredIndex - 1; i >= index; i--) {
      const height = getEstimatedItemHeight();
      measuredData[i] = { height, offset };
      offset += height;
    }
    measuredDataInfo.topMostMeasuredIndex = index;
  }
  console.log(`kennen index ${index}`);
  return measuredData[index];
}


/**
 * 获取需要渲染的最上方 item 的 index
 * 
 * @param listRealheight 聊天框高度，用于计算聊天框中可以放多少个气泡
 * @param endIndex {@link getEndIndex(number)} 返回值
 * 
 * @returns 第一条要渲染的记录，即最上面一条聊天记录
 */
const getStartIndex = (listRealheight: number, endIndex: number) => {
  const bottomMostItem = getMesuredData(endIndex);
  const maxVisibleOffset = bottomMostItem.offset + listRealheight;
  let offset = bottomMostItem.offset + bottomMostItem.height;
  let startIndex = endIndex;
  while (
    offset >= maxVisibleOffset 
    && startIndex >= 0
  ) {
    startIndex++;
    offset += getMesuredData(startIndex).height;
  }
  return startIndex;
}

/**
 * 获取需要渲染的最下方 item 的 index
 * 
 * @param scrolledOffset 从下往上已经滚动的距离
 * 
 * @returns 当前窗口中最后一条要渲染的聊天记录，即最底下的一条
 */
const getEndIndex = (itemCount: number, scrolledOffset: number) => {
  console.log(`kennen getEndIndex ${itemCount - 1}`);
  // 如果为初始化的 index，那么 end index 就是最后一条消息
  if (measuredDataInfo.topMostMeasuredIndex === -1) {
    measuredDataInfo.topMostMeasuredIndex = itemCount - 1;
    return itemCount - 1;
  } else {
    for (let i = itemCount - 1; ; i--) {
      const offset = getMesuredData(i).offset;
      if (offset >= scrolledOffset) {
        return i;
      }
      if (i <= 0) {
        return 0;
      }
    }
  }
}

/**
 * 获取虚拟列表真正需要渲染的数据的 index
 * 
 * @param itemCount 整个聊天记录的总记录条数
 * @param listRealheight 聊天框的真实高度
 * @param scrolledOffset 当前已经滚动过的距离
 * 
 * @returns 当前滚动窗口下实际需要渲染的子 item 的开始和结束下标
 */
const getRenderIndex = (itemCount: number, listRealheight: number, scrolledOffset: number) => {
  const endIndex = getEndIndex(itemCount, scrolledOffset);
  const startIndex = getStartIndex(listRealheight, endIndex);
  return [startIndex, endIndex];
}

const KVirtualList: React.FC<IKVirtualListProps> = (props: IKVirtualListProps) => {

  const {
    messages,
  } = props;

  /**
   * 列表的虚拟高度，用于撑开滚动条
   * 
   * 初始化为 item 数量 * item 的预估高度
   */
  const [listVirtualHeight, setListVirtualHeight] = useState(messages.length * getEstimatedItemHeight());

  /**
   * 列表的真实高度
   * 
   * flex：1，撑满父容器的剩余空间
   */
  const [listRealHeight, setListRealHeight] = useState(500);

  /**
   * 聊天记录需从底部开始滑动
   * 因此滑动过的距离应该是：列表总高度 H - scrollTop - 可视窗口高度 height
   */
  const [scrolledOffset, setScrolledOffset] = useState(0);

  /**
   * 触发渲染
   */
  const [, setNotifyUpdate] = useState({});

  /**
   * 最外层 div 的引用
   */
  const virtualListRef = useRef(null);

  /**
   * 监听虚拟列表自身真实高度
   */
  useEffect(() => {


    const resizeObserver = new ResizeObserver(entries => {  
      const { height } = entries[0].contentRect;
      console.log(`kennen virtual list 高度变化：${listRealHeight} -> ${height}`);
      setListRealHeight(height);
    });
  
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
   * 消息记录的高度由于渲染发生了改变
   * 1. 更新下标为 index 的 item 的高度
   * 2. 将从 index 开始到最底部（最新）消息的偏移进行更正
   */
  const onChildSizeChanged = (index: number, offsetHeight: number) => {
    const { measuredData, topMostMeasuredIndex } = measuredDataInfo;
    measuredData[index].height = offsetHeight;
    
    let offset = 0;
    for (let i = messages.length - 1; i >= topMostMeasuredIndex; i--) {
      const itemData = measuredData[i];
      itemData.offset = offset;
      offset += itemData.height;
    }
    setNotifyUpdate({});
  }

  /**
   * 实例化真正需要渲染的 item
   * 
   * @returns 需要渲染的 item 的列表
   */
  const getRenderMessageList = () => {
    const [startIndex, endIndex] = getRenderIndex(
      messages.length,
      listRealHeight,
      scrolledOffset,
    );
    console.log(`kennen start: ${startIndex}, end: ${endIndex}`);
    const messageList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const bottom = getMesuredData(i).offset;
      console.log(`kennen index ${i} offset: ${bottom}`);
      const itemStyles = {
        position: 'absolute',
        bottom: bottom,
      };
      messageList.push(
        <Message 
          key={messages[i].fingerprint}
          message={messages[i]}
          onSizeChanged={offsetHeight => onChildSizeChanged(i, offsetHeight)}
          styles={itemStyles}
        />
      );
    }
    return messageList;
  }

  const throttledScroll = _.throttle((event: React.UIEvent<HTMLDivElement, UIEvent>) => 
    setScrolledOffset(listVirtualHeight - event.currentTarget.scrollTop - listRealHeight),
    100
  );

  return (
    <div 
      className='v-list-container'
      onScroll={throttledScroll}
    >
      {getRenderMessageList()}
    </div>
  );
};

export default KVirtualList;