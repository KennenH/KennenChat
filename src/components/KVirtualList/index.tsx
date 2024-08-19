import React, { useState } from 'react';
import './index.scss';
import { IChatMessage } from '../ChatCard';
import Message from '../Message';

interface IKVirtualListProps {
  height: number,
  messages: IChatMessage[],
}

/**
 * 子 item 的测量数据
 */
interface MeasuredItem {
  /**
   * 子 item 的高度
   */
  height: number,

  /**
   * 子 item 的 bottom 偏移量
   */
  offset: number,
}

/**
 * 已经测量的子 item 的缓存数据
 */
interface MeasuredDataInfo {
  /**
   * 所有已测量的子 item 缓存数据
   */
  measuredData: MeasuredItem[],

  /**
   * 最上方的（最旧的）已经测量的子 item 的下标
   */
  topMostMeasuredIndex: number,
}

/**
 * 根据屏幕上已经渲染过的气泡取平均来估算整个列表的长度
 */
const getEstimatedItemHeight = () => {
  return 120;
}

/**
 * 获取对应下标的 item 高度和偏移
 * 
 * @param index 要获取测量数据的子 item 的下标
 * 
 * @returns 对应下标的子 item 的测量数据 {@link MeasuredItem}
 */
const getItemMesuredData = (index: number) => {
  const { measuredData, topMostMeasuredIndex } = measuredDataInfo;
  if (index < topMostMeasuredIndex) {
    let offset = 0;
    if (topMostMeasuredIndex !== -1) {
      const topMostMeasuredItem = measuredData[topMostMeasuredIndex];
      offset += topMostMeasuredItem.offset + topMostMeasuredItem.height;
    }
    // 从下到上计算没有被测量的 item
    for (let i = topMostMeasuredIndex - 1; i >= index; i--) {
      const height = getEstimatedItemHeight();
      measuredData[i] = { height, offset };
      offset += height;
    }
    measuredDataInfo.topMostMeasuredIndex = index;
  }
  return measuredData[index];
}


/**
 * 获取需要渲染的最上方 item 的 index
 * 
 * @param height 聊天框高度，用于计算聊天框中可以放多少个气泡
 * @param endIndex {@link getEndIndex(number)} 返回值
 * 
 * @returns 第一条要渲染的记录，即最上面一条聊天记录
 */
const getStartIndex = (height: number, endIndex: number) => {
  const bottomMostItem = getItemMesuredData(endIndex);
  const maxVisibleOffset = bottomMostItem.offset + height;
  let offset = bottomMostItem.offset + bottomMostItem.height;
  let startIndex = endIndex;
  while (
    offset >= maxVisibleOffset 
    && startIndex >= 0
  ) {
    startIndex++;
    offset += getItemMesuredData(startIndex).height;
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
  // 如果为初始化的 index，那么 end index 就是最后一条消息
  if (measuredDataInfo.topMostMeasuredIndex === -1) {
    return itemCount - 1;
  } else {
    for (let i = itemCount - 1; ; i--) {
      const offset = getItemMesuredData(i).offset;
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
 * @param height 聊天框的可见高度
 * @param scrolledOffset 当前已经滚动过的距离
 * 
 * @returns 当前滚动窗口下实际需要渲染的子 item 的开始和结束下标
 */
const getRenderIndex = (itemCount: number, height: number, scrolledOffset: number) => {
  const endIndex = getEndIndex(itemCount, scrolledOffset);
  const startIndex = getStartIndex(height, endIndex);
  return [startIndex, endIndex];
}

/**
 * 已经计算好的子 item 的信息
 */
const measuredDataInfo: MeasuredDataInfo = {
  measuredData: [],
  topMostMeasuredIndex: -1,
};

const KVirtualList: React.FC<IKVirtualListProps> = (props: IKVirtualListProps) => {

  const {
    height,
    messages,
  } = props;

  /**
   * 列表的虚拟高度，用于撑开滚动条
   * 列表的实际高度，即可视窗口的高度是 {@link props.height}
   * 
   * 初始化为 item 数量 * item 的预估高度
   */
  const [listVirtualHeight, setListVirtualHeight] = useState(messages.length * getEstimatedItemHeight());

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
      height,
      scrolledOffset,
    );
    console.log(`start: ${startIndex}, end: ${endIndex}`);
    const messageList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const bottom = getItemMesuredData(i).offset;
      console.log(`index ${i} offset: ${bottom}`);
      const itemStyles = {
        position: 'absolute',
        bottom: bottom,
      };
      messageList.push(
        <Message 
          message={messages[i]}
          onSizeChanged={offsetHeight => onChildSizeChanged(i, offsetHeight)}
          styles={itemStyles}
        />
      );
    }
    return messageList;
  }

  const handleScrollMessageList = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    setScrolledOffset(listVirtualHeight - event.currentTarget.scrollTop - height);
  }

  return (
    <div 
      className='v-list-container'
      style={{ height: listVirtualHeight }}
      onScroll={handleScrollMessageList}
    >
      {getRenderMessageList()}
    </div>
  );
};

export default KVirtualList;