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

export const getRandomInt = (min: number, max: number) => {  
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}  