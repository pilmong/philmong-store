import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getKSTDate(date: Date = new Date()) {
  try {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  } catch (e) {
    // Fallback if Intl is not supported or fails
    return new Date(date.getTime() + (9 * 60 * 60 * 1000));
  }
}

export function getKSTRange(date: Date) {
  const kst = getKSTDate(date);
  const year = kst.getFullYear();
  const month = kst.getMonth();
  const day = kst.getDate();

  // KST 00:00:00 is UTC-9 hours from the perspective of a Date.UTC call with KST numbers
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0) - (9 * 60 * 60 * 1000));
  const end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - (9 * 60 * 60 * 1000));

  return { start, end };
}

/**
 * 주문 마감 여부 확인
 * @param targetDate 주문 목표 일자
 * @param deadlineHour 마감 시간 (기본값: 15시)
 * @param isSameDay 마감일이 주문 목표일과 같은지 여부 (기본값: false = 전날 마감)
 * @returns 마감 여부 (true: 마감됨, false: 수정 가능)
 */
export function isOrderDeadlinePassed(targetDate: Date, deadlineHour: number = 15, isSameDay: boolean = false) {
  const now = getKSTDate(new Date());

  // 마감 기준일 설정
  const targetKST = getKSTDate(targetDate);
  const deadlineDate = new Date(targetKST);

  // 전남 마감이 기본, isSameDay가 true면 당일 마감
  if (!isSameDay) {
    deadlineDate.setDate(deadlineDate.getDate() - 1);
  }

  // 마감 기준 시간 설정
  const deadlineTime = new Date(deadlineDate);
  deadlineTime.setHours(deadlineHour, 0, 0, 0);

  return now.getTime() > deadlineTime.getTime();
}
