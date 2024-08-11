/**
 * 将日期对象转换为 yyyy/MM/dd hh:mm:ss 形式
 */
export const formatDate = (date?: Date): string => {  
  if (!date) return '';
  
  const year = date.getFullYear();  
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份加1并补0  
  const day = date.getDate().toString().padStart(2, '0'); // 日期补0  
  const hours = date.getHours().toString().padStart(2, '0'); // 小时补0  
  const minutes = date.getMinutes().toString().padStart(2, '0'); // 分钟补0  
  const seconds = date.getSeconds().toString().padStart(2, '0'); // 秒补0  
    
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;  
}

/**
 * 两个时间相差是否大于等于5分钟
 */
export const isTimeDifferenceMoreThanFiveMinutes = (date1?: Date, date2?: Date): boolean => {  
  if (!date1 || !date2) {
    return false;
  }
  
  const diff = Math.abs(date1.getTime() - date2.getTime());  
  return diff >= 5 * 1000 * 60;
}