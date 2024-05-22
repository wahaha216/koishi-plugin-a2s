export function secondFormat(
  second: number,
  props?: { millisecond?: boolean; hour?: boolean }
): string {
  second = Math.round(props?.millisecond ? second / 1000 : second);
  if (second < 60) {
    const sStr = second < 10 ? `0${second}` : second;
    return `00:${sStr}`;
  }
  if (props?.hour && second > 3600) {
    const h = Math.floor(second / 3600);
    const m = Math.floor((second % 3600) / 60);
    const s = second % 60;
    const hStr = h < 10 ? `0${h}` : h;
    const mStr = m < 10 ? `0${m}` : m;
    const sStr = s < 10 ? `0${s}` : s;
    return `${hStr}:${mStr}:${sStr}`;
  } else {
    const m = Math.floor(second / 60);
    const s = second % 60;
    const mStr = m < 10 ? `0${m}` : m;
    const sStr = s < 10 ? `0${s}` : s;
    return `${mStr}:${sStr}`;
  }
}

export function timeStringToSecond(str: string): number {
  const arr = str.split(":");
  if (/\d{1,2}:\d{1,2}:\d{1,2}(\.\d{2})?/.test(str)) {
    return parseInt(arr[0]) * 3600 + parseInt(arr[1]) * 60 + parseFloat(arr[2]);
  } else if (/\d{1,2}:\d{1,2}(\.\d{2})?/.test(str)) {
    return parseInt(arr[1]) * 60 + parseFloat(arr[2]);
  } else {
    return 0;
  }
}
