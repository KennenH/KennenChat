/**
 * 虚拟列表
 * 
 * 1. 估算所有子 item 的总高度，撑开滚动条
 * 2. 找到真正需要渲染的子 item 的 index 并在正确的偏移处渲染它们
 *    - 由于聊天列表必然是从底部开始往上拉的，所以最后一个 item 的 bottom 为 0
 *    - 对于在任意位置的子 item，都可以通过它下方的子 item 的偏移和高度相加进行计算
 *    
 *    -> 列表在往上滚动的过程中计算沿途的子 item 的 bottom 和高度，并作为后续子 item 的位置计算的基础
 * 
 * 0831 bugfix: 由于虚拟列表高度计算为自下而上，气泡组件仅设置了 bottom，当消息气泡的高度更改时才会通知父组件撑开滚动条
 * 导致子组件变高时以底部为基准向上生长，通知父组件更新后上边缘才回到原来的位置，视觉效果就是消息气泡上下跳动
 * 
 * refactor：将虚拟列表高度计算顺序更改为自顶向下，气泡以顶部为基准向下生长
 * 可能产生的问题：最新消息的位置可能由于计算问题不准确
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
 * 对应聊天的子 item 的测量数据
 * item 测量数据未初始化时为空，通过 {@link KVirtualList.getMesuredData[i]} 访问对应的 item 测量数据
 */
interface MeasuredItems {
  /**
   * height：子 item 的真实高度
   * 0831 refactor: offset 更改为 top 的偏移量
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
   * 必须通过调用 {@link KVirtualList.getMesuredData} 访问对应的 item 的测量数据
   * 如果在 {@link KVirtualList.getMesuredData} 之外访问可能会直接报错
   */
  measuredItems: MeasuredItems,

  /**
   * 0831 refactor：当前聊天最下方的（最新的）已经测量的子 item 的下标
   */
  bottomMostMeasuredIndex: number,
}

/**
 * 已经计算好的子 item 的信息
 * 调用 {@link KVirtualList.useMeasuredDataInfo} 访问，不要直接访问！！！
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
   * 外层 div 尺寸改变监听器
   */
  private outerDivResizeObserver: ResizeObserver | undefined;

  /**
   * 哑节点 div ref
   */
  private dummyDivRef: RefObject<HTMLDivElement>;

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
       * 
       * 0831 refactor：聊天记录从顶部开始滑动，滑动距离直接取 scrollTop
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
        // this.updateOnNewMessage(nextId, nextMessageList.length, nextLen - nowLen);
      } else {
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
          measuredItems: {},
          bottomMostMeasuredIndex: -1,
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
   * 
   * @param index 当前更新的子 item 的下标
   * @param offsetHeight 子 item 更新后的高度
   */
  private onChildSizeChanged = (
    index: number, 
    offsetHeight: number,
  ) => {
    const { chatCardProps: { messageList, id } } = this.props;
    if (!messageList) {
      return;
    }
    const measuredDataInfo = this.useMeasuredDataInfo[id];
    const { bottomMostMeasuredIndex } = measuredDataInfo;
    const { chatCardProps: { id: chatCardId } } = this.props;
    const measuredItem = this.getMesuredData(index);
    
    // 如果滚动到底部了，那么可以直接确定虚拟列表的最终虚拟高度
    const { listVirtualHeights } = this.state;
    const newListVirtualHeights = {...listVirtualHeights};
    if (bottomMostMeasuredIndex === messageList.length - 1) {
      const { height, offset } = this.getMesuredData(messageList.length - 1);
      newListVirtualHeights[chatCardId] = height + offset;
    } else {
      // 每渲染一个子 item 都更新虚拟高度
      newListVirtualHeights[chatCardId] += offsetHeight - measuredItem.height;
    }

    // 更新测量数据中当前 item 的高度
    measuredItem.height = offsetHeight;
    // 0831 refactor：以上边缘为基准向下生长，top 不变，所以只对下方所有 item 有影响，对上方 item 无影响
    // 更新从当前 item 的下一个 item 到最新消息的偏移
    const thisItem = measuredItem;
    let offset = thisItem.offset + thisItem.height;
    for (let i = index + 1; i < messageList.length; i++) {
      const itemMeasuredData = this.getMesuredData(i);
      itemMeasuredData.offset = offset;
      offset += itemMeasuredData.height;
    }

    requestAnimationFrame(() => {
      this.setState({ listVirtualHeights: newListVirtualHeights });
    });
  }

  /**
   * 根据列表可视高度和第一条要渲染的数据获取最下方要渲染的 item 的下标
   * 
   * @param startIndex 第一条要渲染的记录，{@link getStartIndex(number)} 返回值
   * @returns 最后一条要渲染的记录，即最下方的聊天记录
   */
  private getEndIndex = (startIndex: number) => {
    const { listRealHeight } = this.state;
    const { chatCardProps: { messageList } } = this.props;
    const startItemMeasuredData = this.getMesuredData(startIndex);
    const maxVisibleOffset = startItemMeasuredData.offset + listRealHeight;
    let offset = startItemMeasuredData.offset + startItemMeasuredData.height;
    let endIndex = startIndex;

    while (
      offset <= maxVisibleOffset 
      && endIndex < messageList.length
    ) {
      offset += this.getMesuredData(endIndex).height;
      endIndex++;
    }

    return endIndex;
  }

  /**
   * 获取需要渲染的最上方 item 的 index
   * 
   * @returns 当前窗口中第一条要渲染的聊天记录，即最上方的一条
   */
  private getStartIndex = (
  ) => {
    const { chatCardProps: { messageList, id } } = this.props;
    const measuredDataInfo = this.useMeasuredDataInfo[id];
    const itemCount = messageList.length;

    // 如果为初始化的 index，那么第一条要渲染的 index 就是 0
    if (measuredDataInfo.bottomMostMeasuredIndex === -1) {
      return 0;
    } else {
      const { scrolledOffset } = this.state;
      for (let i = 0; ; i++) {
        const offset = this.getMesuredData(i).offset;
        if (offset >= scrolledOffset) {
          return i;
        }
        if (i >= itemCount - 1) {
          return itemCount - 1;
        }
      }
    }
  }

  /**
   * 获取 item 初始化高度
   * 
   * @todo 以屏幕上已经渲染过的 item 高度取平均来预估
   * 1. 如果是 gpt 的输出，一般高度值比较大，用户输入值一般比较小
   * 2. 可以根据聊天气泡内的字数来估算高度
   */
  private getEstimatedItemHeight = () => {
    return 115;
  }

  /**
   * 获取虚拟列表真正需要渲染的数据的 index
   * 
   * @returns 当前滚动窗口下实际需要渲染的子 item 的开始和结束下标
   */
  private getRenderIndex = () => {
    const { chatCardProps: { messageList } } = this.props;
    const startIndex = this.getStartIndex();
    const endIndex = this.getEndIndex(startIndex);

    return [Math.max(0, startIndex - 3), Math.min(endIndex + 3, messageList.length - 1)];
  }

  /**
   * 获取对应下标的 item 高度和偏移
   * 
   * @param index 要获取测量数据的子 item 的下标
   * @returns 对应下标的子 item 的测量数据 {@link MeasuredItems}
   */
  private getMesuredData = (index: number) => {
    const { chatCardProps: { id } } = this.props;
    const measuredDataInfo = this.useMeasuredDataInfo[id];
    const { measuredItems, bottomMostMeasuredIndex } = measuredDataInfo;
    
    // 如果是 bottom most 下方的 item，则需要测量
    // 否则，说明已经测量过，直接返回
    if (index > bottomMostMeasuredIndex) {
      let offset = 0;
      const bottomMostMeasuredItem = measuredItems?.[bottomMostMeasuredIndex];
      if (bottomMostMeasuredItem) {
        offset += bottomMostMeasuredItem.offset + bottomMostMeasuredItem.height;
      }

      // 从上到下计算没有被测量的 item 的位置
      const initHeight = this.getEstimatedItemHeight();
      for (let i = bottomMostMeasuredIndex + 1; i <= index; i++) {
        measuredItems[i] = { height: initHeight, offset };
        offset += initHeight;
      }

      // 将最新测量的 item 下标更新为当前 index
      measuredDataInfo.bottomMostMeasuredIndex = index;
    }

    console.log(`kennen i=${index}`, measuredItems[index]);
    return measuredItems[index];
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
    const measuredItems = measuredDataInfo.measuredItems;
    
    // 从 bottomMost 更新至最新添加的消息
    let offset = 0;
    const latestOldMessageIdx = itemCount - 1 - countDiff;
    // 1. 之前已经存在的、但未被测量的数据
    for (let i = latestOldMessageIdx; i >= measuredDataInfo.bottomMostMeasuredIndex; i--) {
      measuredItems[i].offset = offset;
      offset += measuredItems[i].height;
    }

    // 2. 新增消息预估测量数据：只更新新增部分的消息 
    for (let i = itemCount - 1; i > latestOldMessageIdx; i--) {
      measuredItems[i] = { 
        height: estimatedHeight,
        offset,
      };
      offset += estimatedHeight;
    }
  }

  /**
   * 虚拟列表滚动至底部
   */
  public scrollToBottom = () => {
    if (this.dummyDivRef.current) {
      this.dummyDivRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    const { chatCardProps: { messageList } } = this.props;
    if (!messageList) {
      return;
    }
    const [startIndex, endIndex] = this.getRenderIndex();
    const renderList = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const offset = this.getMesuredData(i).offset;
      const itemStyles = {
        position: 'absolute',
        top: offset,
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
          onSizeChanged={offsetHeight => this.onChildSizeChanged(i, offsetHeight)}
          styles={itemStyles}
        />
      );
    }
    return renderList;
  }

  private onScroll = () => {
    if (this.virtualListRef.current) {
      // 实际上起到一个手动更新 ui 的作用
      this.setState({ scrolledOffset: this.virtualListRef.current.scrollTop });
    }
  };

  render() {
    const { listVirtualHeights } = this.state;
    const { chatCardProps: { id } } = this.props;
    return (
      <div 
        className='v-list-container'
        onScroll={this.onScroll}
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