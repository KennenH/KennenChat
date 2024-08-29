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
import React, { RefObject } from 'react';
import './index.scss';
import { IChatCardProps, IChatMessage, Sender } from '../ChatCard';
import Message from '../Message';
import _, { throttle } from 'lodash';
import messageStore from '@/store/MessageStore';
import { inject, observer } from 'mobx-react';

interface IKVirtualListProps {
  chatCardProps: IChatCardProps,
}

interface ListVirtualHeights {
  [key: string]: number,
}

/**
 * 子 item 的测量数据
 */
interface MeasuredItem {
  /**
   * height：子 item 的真实高度
   * offset：bottom 偏移量
   */
  [key: number]: { height: number, offset: number }
}

/**
 * 所有聊天已经测量的子 item 的缓存数据
 * id：对应的 chat id
 */
interface MeasuredDataInfos {
  [id: string]: MeasuredDataInfo,
}

/**
 * 当前聊天已测量的子 item 缓存数据
 */
export interface MeasuredDataInfo {
  /**
   * 当前聊天所有已测量的子 item 缓存数据
   */
  measuredItem: MeasuredItem,

  /**
   * 当前聊天最上方的（最旧的）已经测量的子 item 的下标
   */
  topMostMeasuredIndex: number,

  /**
   * 当前聊天虚拟列表的虚拟高度，用于撑开滚动条
   */
  // listVirtualHeight: number,
}

/**
 * 已经计算好的子 item 的信息
 * 调用 {@link useMeasuredDataInfo} 来访问，不要直接访问！！！
 */
const measuredDataInfos: MeasuredDataInfos = {};

interface IKVirtualListState {
  listRealHeight: number,
  listVirtualHeights: ListVirtualHeights,
  scrolledOffset: number,
}

@observer
@inject('globalStore', 'messageStore')
class KVirtualList extends React.Component<IKVirtualListProps, IKVirtualListState> {

  /**
   * 外层 div ref
   */
  private virtualListRef: RefObject<HTMLDivElement>;

  /**
   * 哑节点 div ref
   */
  private dummyDivRef: RefObject<HTMLDivElement>;

  private outerDivResizeObserver: ResizeObserver | undefined;

  constructor(props: IKVirtualListProps) {
    super(props);
    this.state = {
      /**
       * 列表的真实高度，外部列表的高度
       * 
       * flex：1，撑满父容器的剩余空间
       */
      listRealHeight: 500,

      /**
       * 列表的虚拟高度，内部列表的高度，用于撑开滚动条
       * 
       * 初始化为 item 数量 * item 的预估高度
       */
      listVirtualHeights: {},

      /**
       * 聊天记录需从底部开始滑动
       * 因此滑动过的距离应该是：列表总高度 H - scrollTop - 可视窗口高度 height
       */ 
      scrolledOffset: 0,

    }

    this.virtualListRef = React.createRef();
    this.dummyDivRef = React.createRef();
  }

  componentDidMount(): void {
    this.initObservers();
    this.initListVirtualHeights();
  }

  UNSAFE_componentWillReceiveProps(
    nextProps: Readonly<IKVirtualListProps>, 
    nextContext: any
  ): void {
    const { chatCardProps: { messageList, id } } = this.props;
    const { messageList: nextMessageList, id: nextId } = nextProps.chatCardProps;
    if (
      nextMessageList 
      && id === nextId 
      && nextMessageList !== messageList
    ) {
      const nextLen = nextMessageList.length;
      const nowLen = messageList.length;
      // 有新消息时：更新虚拟列表高度和测量数据
      if (nextLen > nowLen) {
        this.updateOnNewMessage(nextId, nextMessageList.length, nextLen - nowLen);
      } else { // 删除消息时
        // todo 删除消息后更新虚拟列表高度和测量数据
      }
    }
  }

  componentDidUpdate(
    prevProps: Readonly<IKVirtualListProps>, 
    prevState: Readonly<IKVirtualListState>, 
    snapshot?: any
  ): void {
    const { messageList: prevMessageList, id: prevId } = prevProps.chatCardProps;
    const { chatCardProps: { messageList, id } } = this.props;
    
    if (id !== prevId) { // 切换聊天
      // 滚动条置顶，防止滚动条状态重用，导致切换聊天后滚动条初始位置令人困惑
      if (this.virtualListRef.current) {
        this.virtualListRef.current.scrollTop = 0;
      }

      this.initListVirtualHeights();
    } else if (messageList !== prevMessageList) { // 同一个聊天消息更新
      if (messageStore.isFetchingMsg) {
        requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }
    }
  }

  componentWillUnmount(): void {
    // 清理 Observers
    if (this.virtualListRef.current && this.outerDivResizeObserver) {
      this.outerDivResizeObserver.unobserve(this.virtualListRef.current);
    }
  }

  /**
   * 以当前 props 初始化虚拟列表的高度，防止第一次进入某个聊天时虚拟列表高度为 0 什么都不显示
   */
  private initListVirtualHeights = () => {
    const { chatCardProps: { id, messageList } } = this.props;
    const { listVirtualHeights } = this.state;
    if (!listVirtualHeights[id]) {
      const newListVirtualHeights = { ...listVirtualHeights };
      newListVirtualHeights[id] = messageList.length * this.getEstimatedItemHeight();
      requestAnimationFrame(() => {
        this.setState({
          listVirtualHeights: newListVirtualHeights
        }, this.scrollToBottom);
      });
    }
    this.scrollToBottom();
  }

  /**
   * 初始化观察者
   */
  private initObservers = () => {
    if (!this.virtualListRef.current) {
      return;
    }
    // 外层 div 高度改变回调
    const throttledOuterDivResizeCallback = (entries: any) => {
      const { height } = entries[0].contentRect;
      this.setState({ listRealHeight: height });
    }
    /**
     * 外层 div 高度变化 = 列表可见高度变化 {@link listRealHeight}
     */
    this.outerDivResizeObserver = new ResizeObserver(throttledOuterDivResizeCallback);
    this.outerDivResizeObserver.observe(this.virtualListRef.current);   
  }

  /**
   * 使用 proxy 拦截获取，当为 undefined 时进行初始化
   */
  private useMeasuredDataInfo = new Proxy(measuredDataInfos, {
    get: (measuredDataInfos: MeasuredDataInfos, chatId: string) => {
      // 返回函数可以接收一个 itemCount 参数
      if (!measuredDataInfos[chatId]) {
        measuredDataInfos[chatId] = {
          measuredItem: {},
          topMostMeasuredIndex: -1,
        };
      }
      return measuredDataInfos[chatId];
    }
  });

  /**
   * 消息记录的高度由于渲染发生了改变，更新虚拟列表的虚拟高度
   * 
   * 1. 更新虚拟列表的虚拟高度
   * 2. 更新下标为 index 的 item 的高度
   * 3. 将从 index 开始到最底部（最新）消息的偏移进行更正
   */
  private onChildSizeChanged = (
    index: number, 
    offsetHeight: number,
    measuredDataInfo: MeasuredDataInfo, 
    messages?: IChatMessage[],
  ) => {
    if (!messages) {
      return;
    }
    const { measuredItem, topMostMeasuredIndex } = measuredDataInfo;
    const { chatCardProps: { id: chatCardId } } = this.props;
    const { listVirtualHeights } = this.state;

    const newListVirtualHeights = {...listVirtualHeights};
    // 如果滚动到顶部了，那么可以直接确定虚拟列表的最终虚拟高度
    if (topMostMeasuredIndex === 0) {
      const { height, offset } = measuredItem[0];
      newListVirtualHeights[chatCardId] = height + offset;
    } else {
      // 每渲染一个子 item 都更新虚拟高度
      newListVirtualHeights[chatCardId] += offsetHeight - measuredItem[index].height;
    }

    // 更新下标为 index 的 item 的高度    
    measuredItem[index].height = offsetHeight;
    // 更新从 topMostMeasuredIndex 开始到最新消息的偏移
    let offset = 0;
    for (let i = messages.length - 1; i >= topMostMeasuredIndex; i--) {
      const itemData = measuredItem[i];
      itemData.offset = offset;
      offset += itemData.height;
    }

    requestAnimationFrame(() => {
      if (listVirtualHeights[chatCardId] <= newListVirtualHeights[chatCardId]) {
        this.setState({ listVirtualHeights: newListVirtualHeights });
      }
    });
  }

  /**
   * 获取需要渲染的最上方 item 的 index
   * 
   * @param listRealheight 聊天框高度，用于计算聊天框中可以放多少个气泡
   * @param endIndex {@link getEndIndex(number)} 返回值
   * @returns 第一条要渲染的记录，即最上面一条聊天记录
   */
  private getStartIndex = (
    listRealheight: number, 
    endIndex: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const bottomMostItem = this.getMesuredData(endIndex, measuredDataInfo);
    const maxVisibleOffset = bottomMostItem.offset + listRealheight;
    let offset = bottomMostItem.offset + bottomMostItem.height;
    let startIndex = endIndex;
    while (
      offset <= maxVisibleOffset 
      && startIndex > 0
    ) {
      startIndex--;
      offset += this.getMesuredData(startIndex, measuredDataInfo).height;
    }
    return startIndex;
  }

  /**
   * 获取需要渲染的最下方 item 的 index
   * 
   * @param scrolledOffset 从下往上已经滚动的距离
   * @returns 当前窗口中最后一条要渲染的聊天记录，即最底下的一条
   */
  private getEndIndex = (
    itemCount: number, 
    scrolledOffset: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    // 如果为初始化的 index，那么 end index 就是最后一条消息
    if (measuredDataInfo.topMostMeasuredIndex === -1) {
      measuredDataInfo.topMostMeasuredIndex = itemCount;
      return itemCount - 1;
    } else {
      for (let i = itemCount - 1; ; i--) {
        const offset = this.getMesuredData(i, measuredDataInfo).offset;
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
   * 根据屏幕上已经渲染过的气泡取平均来估算整个列表的长度
   * 
   * 1. 如果是 gpt 的输出，一般高度值比较大，用户输入值一般比较小
   * 2. 可以根据聊天气泡内的字数来估算高度
   */
  private getEstimatedItemHeight = () => {
    return 115;
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
  private getRenderIndex = (
    itemCount: number, 
    listRealheight: number, 
    scrolledOffset: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const endIndex = this.getEndIndex(itemCount, scrolledOffset, measuredDataInfo);
    const startIndex = this.getStartIndex(listRealheight, endIndex, measuredDataInfo);
    return [Math.max(0, startIndex - 3), Math.min(itemCount - 1, endIndex + 3)];
  }

  /**
   * 获取对应下标的 item 高度和偏移
   * 
   * @param index 要获取测量数据的子 item 的下标
   * @returns 对应下标的子 item 的测量数据 {@link MeasuredItem}
   */
  private getMesuredData = (
    index: number, 
    measuredDataInfo: MeasuredDataInfo
  ) => {
    const { measuredItem } = measuredDataInfo;
    let { topMostMeasuredIndex } = measuredDataInfo;
    if (index < topMostMeasuredIndex) {
      let offset = 0;
      const topMostMeasuredItem = measuredItem?.[topMostMeasuredIndex];
      if (topMostMeasuredItem) {
        offset += topMostMeasuredItem.offset + topMostMeasuredItem.height;
      }
      // 从下到上计算没有被测量的 item 的位置
      for (let i = topMostMeasuredIndex - 1; i >= index; i--) {
        const height = this.getEstimatedItemHeight();
        measuredItem[i] = { height, offset };
        offset += height;
      }
      measuredDataInfo.topMostMeasuredIndex = index;
    }
    return measuredItem[index];
  }

  /**
   * 当有新消息时更新已经测量过的偏移数据
   * 
   * @param chatCardId 聊天 id
   * @param itemCount 更新后聊天中有多少条聊天记录
   * @param countDiff 上一次 messageList 和这一次 messageList 的元素多了几个
   */
  private updateOnNewMessage = (
    chatCardId: string, 
    itemCount: number,
    countDiff: number,
  ) => {
    // 更新虚拟列表的高度，即加上 diif 个新消息的预估高度
    const measuredDataInfo = this.useMeasuredDataInfo[chatCardId];
    const estimatedHeight = this.getEstimatedItemHeight();

    // 将新消息的预估高度和偏移量放入测量数据
    // 这一步是保证虚拟列表动态添加后能够在渲染的任何时候获取到子组件测量数据的关键
    const measuredItem = measuredDataInfo.measuredItem;
    
    // 从最新一条消息更新至 topMost，分两段更新
    // 1. 新增消息预估测量数据：只更新新增部分的消息 
    let offset = 0;
    // 两段更新分界点，算在已有数据中，所以在第二段更新
    const latestOldMessageIdx = itemCount - 1 - countDiff;
    for (let i = itemCount - 1; i > latestOldMessageIdx; i--) {
      measuredItem[i] = { 
        height: estimatedHeight,
        offset,
      };
      offset += estimatedHeight;
    }
    
    // 2. 已有消息更新测量数据：只更新之前已存在的消息
    for (let i = latestOldMessageIdx; i >= measuredDataInfo.topMostMeasuredIndex; i--) {
      measuredItem[i].offset = offset;
      offset += measuredItem[i].height;
    }
  }

  /**
   * 虚拟列表滚动至底部
   */
  public scrollToBottom = () => {
    if (this.dummyDivRef.current) {
      this.dummyDivRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // this.rafScroll();
  }

  private throttledGetRenderMessageList = _.throttle(() => {
    return this.getRenderMessageList();
  }, 200, { leading: true, trailing: true });

  /**
   * 实例化真正需要渲染的 item
   * 
   * @returns 需要渲染的 item 的列表
   */
  private getRenderMessageList = () => {
    const { chatCardProps: { messageList, id } } = this.props;
    if (!messageList) {
      return;
    }

    const { listRealHeight, scrolledOffset } = this.state;
    const measuredDataInfo = this.useMeasuredDataInfo[id];
    const [startIndex, endIndex] = this.getRenderIndex(
      messageList.length,
      listRealHeight,
      scrolledOffset,
      measuredDataInfo,
    );
    const renderList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const bottom = this.getMesuredData(i, measuredDataInfo).offset;
      const itemStyles = {
        position: 'absolute',
        bottom: bottom,
      };
      renderList.push(
        <Message 
          key={messageList[i].fingerprint}
          message={messageList[i]}
          isShowLoading={
            i === messageList.length - 1 
              && messageList[i].sender === Sender.ASSISTANT
              && messageStore.isConnecting
          }
          onSizeChanged={offsetHeight => this.onChildSizeChanged(i, offsetHeight, measuredDataInfo, messageList)}
          styles={itemStyles}
        />
      );
    }
    return renderList;
  }

  private rafScroll = () => {
    if (this.virtualListRef.current) {
      const { listVirtualHeights, listRealHeight } = this.state;
      const { chatCardProps: { id } } = this.props;
      const listVirtualHeight = listVirtualHeights[id];
      this.setState({
        scrolledOffset: listVirtualHeight - this.virtualListRef.current!.scrollTop - listRealHeight
      });
    }
  };

  render() {
    const { listVirtualHeights } = this.state;
    const { chatCardProps: { id } } = this.props;
    return (
      <div 
        className='v-list-container'
        onScroll={this.rafScroll}
        ref={this.virtualListRef}
      >
        <div
          className='v-list-inner-container'
          style={{ height: listVirtualHeights[id] }}
        >
          {this.throttledGetRenderMessageList()}
        {/* 哑节点，用于滑动至底部 */}
        <div 
          // 这里 position 和 bottom 都必须在 style 里动态设置，不能用 class，否则 div 的位置不更新
          style={{ position: 'absolute', bottom: 0 }}
          ref={this.dummyDivRef} 
        />
        </div>
      </div>
    );
  }
};

export default KVirtualList;