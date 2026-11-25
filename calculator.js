'use strict';

const TravelCalculator = (() => {
  const DAY = 86_400_000;
  const DAILY_RATE = 25_000;
  const lodgingCaps = { seoul: 100_000, metro: 80_000, other: 70_000 };

  function requiredInteger(value, label, minimum = 0, maximum = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);
    if (value === '' || !Number.isSafeInteger(number) || number < minimum || number > maximum) {
      throw new Error(`${label} 항목에 ${minimum} 이상의 유효한 정수를 입력해 주세요.`);
    }
    return number;
  }

  function count(value, label, maximum) {
    if (Number(value) > maximum) {
      throw new Error(`${label}은(는) 출장일수 ${maximum}일을 넘을 수 없습니다.`);
    }
    return requiredInteger(value || 0, label, 0, maximum);
  }

  function timeInMinutes(value) {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }

  function longStayDiscount(days) {
    // 제17조의 기간은 도착 다음 날부터 계산한다.
    const afterArrival = Math.max(0, days - 1);
    const tenPercentDays = Math.max(0, Math.min(afterArrival, 30) - 15);
    const twentyPercentDays = Math.max(0, Math.min(afterArrival, 60) - 30);
    const thirtyPercentDays = Math.max(0, afterArrival - 60);
    return DAILY_RATE * (tenPercentDays + 2 * twentyPercentDays + 3 * thirtyPercentDays) / 10;
  }

  function insideTrip(input, days) {
    const minutes = (days - 1) * 1440 + timeInMinutes(input.endTime) - timeInMinutes(input.startTime);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      throw new Error('복귀 시각은 출발 시각보다 늦어야 합니다.');
    }
    const base = minutes >= 240 ? 20_000 : 10_000;
    const deduction = { none: 0, official: 10_000, assigned: base }[input.insideVehicle];
    return {
      context: `근무지 내 국내 출장 · ${Math.floor(minutes / 60)}시간 ${minutes % 60}분`,
      items: [['출장시간 기준액', base], ['차량 조건 감액', -deduction]],
      notes: minutes > 1440 ? ['입력한 기간을 하나의 출장으로 계산했습니다. 여러 차례 출장한 경우에는 건별로 계산해 주세요.'] : [],
    };
  }

  function outsideTrip(input, calendarDays) {
    const actual = input.grade === 'actual';
    const days = !actual && input.eligibleDays
      ? requiredInteger(input.eligibleDays, '지급 대상 여행일수', 1, calendarDays)
      : calendarDays;
    const halfDays = actual ? 0 : count(input.halfDays, '일비가 절반인 일수', days);
    const excludedMeals = actual ? 0 : count(input.excludedMeals, '식비 제외 일수', days);
    const stay = actual ? 0 : count(input.longStay, '같은 곳에 체재한 일수', days);
    const stayDiscount = longStayDiscount(stay);
    let daily = DAILY_RATE * (days - halfDays / 2) - stayDiscount;
    if (actual) daily = requiredInteger(input.actualDaily, '일비 실비 합계');
    else if (halfDays && stayDiscount) daily = requiredInteger(input.confirmedDaily, '기관에서 확인한 감액 후 일비 합계');
    const meals = actual
      ? requiredInteger(input.actualMeal, '식비 실비 합계')
      : DAILY_RATE * (days - excludedMeals);
    const fare = input.fares.reduce((sum, entry) => sum + (entry.kind === 'official' ? 0 :
      requiredInteger(entry.amount, '운임 금액')), 0);

    let nights = 0;
    let lodging = 0;
    let extraLodging = 0;
    for (const entry of input.lodgings) {
      const quantity = requiredInteger(entry.nights, '숙박 일수', 1);
      const rate = requiredInteger(entry.amount, '1박 실비');
      nights += quantity;
      const cap = input.grade === '2' ? lodgingCaps[entry.region] : rate;
      lodging += Math.min(rate, cap) * quantity;
      if (entry.extra) extraLodging += Math.min(Math.max(rate - cap, 0), cap * 0.3) * quantity;
    }
    if (nights >= calendarDays) {
      throw new Error(`숙박 일수 합계는 입력한 출장 기간에서 최대 ${calendarDays - 1}박입니다.`);
    }

    let mileage = 0;
    if (input.mileage) {
      const mileageDays = requiredInteger(input.mileageDays, '일비 추가 지급 인정 일수', 1, days);
      const savings = requiredInteger(input.mileageSavings, '절약한 항공운임', 1);
      mileage = Math.min(mileageDays * DAILY_RATE / 2, savings);
    }

    const notes = [];
    if (!input.fares.length) notes.push('입력한 운임 항목이 없어 운임을 0원으로 계산했습니다.');
    if (!input.lodgings.length && days > 1) notes.push('입력한 숙박 항목이 없어 숙박비를 0원으로 계산했습니다.');
    if (extraLodging) notes.push('숙박비 추가분은 출장 종료 다음 날부터 1주일 이내에 증빙을 제출해 정산을 신청해야 합니다.');
    if (mileage) notes.push('마일리지 추가 일비는 입력한 인정 일수와 절약액 기준의 예상액입니다. 세부 지급 기준은 소속 기관에 확인하세요.');
    return {
      context: `근무지 외 국내 출장 · ${days}일 · ${nights}박 입력`,
      items: [
        ['운임', fare], ['일비', daily], ['숙박비', lodging], ['식비', meals],
        ...(extraLodging ? [['숙박비 초과분', extraLodging]] : []),
        ...(mileage ? [['마일리지 추가 일비', mileage]] : []),
      ],
      notes,
    };
  }

  function calculate(input) {
    const days = (Date.parse(input.endDate) - Date.parse(input.startDate)) / DAY + 1;
    if (!Number.isInteger(days) || days < 1) {
      throw new Error('복귀일은 출장 시작일과 같거나 이후여야 합니다.');
    }
    const result = input.type === 'inside' ? insideTrip(input, days) : outsideTrip(input, days);
    const total = result.items.reduce((sum, [, amount]) => sum + amount, 0);
    if (!Number.isSafeInteger(total) || result.items.some(([, amount]) => !Number.isSafeInteger(amount))) {
      throw new Error('입력한 금액의 합계가 너무 큽니다. 금액을 확인해 주세요.');
    }
    return { ...result, total };
  }

  return { calculate };
})();
