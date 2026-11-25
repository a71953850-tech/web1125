'use strict';

const byId = (id) => document.getElementById(id);
const form = byId('trip-form');
const format = new Intl.NumberFormat('ko-KR');
const fareList = byId('fare-list');
const lodgingList = byId('lodging-list');
let currentResult = null;

function reveal(section, visible) {
  section.hidden = !visible;
  section.querySelectorAll('input, select, button').forEach((field) => { field.disabled = !visible; });
}

function field(entry, name) {
  return entry.querySelector(`[data-field="${name}"]`);
}

function updateFare(entry) {
  const grade = byId('grade').value;
  const kind = field(entry, 'kind').value;
  const guidance = {
    rail: grade === '2' ? '일반실 기준 운임이나 해당 전철 요금을 입력하세요.' : '해당 지급 구분의 철도운임이나 전철 요금을 입력하세요.',
    ship: grade === '2' ? '2등급 기준 운임을 입력하세요.' : '해당 지급 구분의 선박운임을 입력하세요.',
    air: '해당 좌석 등급과 할인·마일리지 적용 후 정산 가능한 운임을 입력하세요.',
    bus: '해당 요율과 할인을 적용한 실제 운임을 입력하세요.',
    car: '해당 지급 구분에 따른 철도 또는 버스 기준 운임을 입력하세요.',
    necessary: '기관 기준에 따라 지급 가능한 연료비와 통행료 등을 합산해 입력하세요.',
    official: '공용 교통수단 이용 구간의 운임은 0원입니다.',
  };
  if (grade === '1' || grade === 'actual') {
    guidance.rail = '특실 기준 운임이나 해당 전철 요금을 입력하세요.';
    guidance.ship = '1등급 기준 운임을 입력하세요.';
  }
  entry.querySelector('.fare-hint').textContent = guidance[kind];
  reveal(entry.querySelector('.fare-cost'), kind !== 'official');
}

function syncForm() {
  const inside = byId('trip-type').value === 'inside';
  const grade = byId('grade').value;
  const actual = grade === 'actual';
  reveal(byId('times'), inside);
  reveal(byId('inside-options'), inside);
  reveal(byId('outside-options'), !inside);
  reveal(byId('outside-sections'), !inside);
  if (inside) return;
  byId('half-days').disabled = actual;
  byId('half-days').parentElement.hidden = actual;
  reveal(byId('actual-fields'), actual);
  reveal(byId('standard-fields'), !actual);
  byId('mileage').disabled = actual;
  byId('mileage').parentElement.hidden = actual;
  reveal(byId('mileage-fields'), !actual && byId('mileage').checked);
  const overlap = !actual && Number(byId('half-days').value) > 0 && Number(byId('long-stay').value) > 16;
  reveal(byId('overlap-fields'), overlap);
  fareList.querySelectorAll('fieldset').forEach(updateFare);
  lodgingList.querySelectorAll('.lodging-exception').forEach((entry) => reveal(entry, grade === '2'));
  if (actual || overlap || byId('mileage').checked) byId('adjustments').open = true;
}

function showPlaceholder(message) {
  byId('total').replaceChildren('— ', unit());
  byId('result-context').textContent = message;
  byId('result-dates').hidden = true;
  byId('breakdown').hidden = true;
  byId('result-notes').hidden = true;
  byId('print-result').disabled = true;
  byId('save-excel').disabled = true;
  currentResult = null;
}

function clearFeedback() {
  byId('form-errors').hidden = true;
  if (currentResult) showPlaceholder('입력이 변경되었습니다. 여비 계산을 다시 눌러 주세요.');
}

function addEntry(template, list) {
  const entry = byId(template).content.firstElementChild.cloneNode(true);
  entry.querySelector('.remove').addEventListener('click', () => {
    entry.remove();
    clearFeedback();
  });
  list.append(entry);
  syncForm();
  clearFeedback();
  entry.querySelector('select').focus();
}

function readInput() {
  const value = (id) => byId(id).value;
  return {
    type: value('trip-type'), startDate: value('start-date'), endDate: value('end-date'),
    startTime: value('start-time'), endTime: value('end-time'), insideVehicle: value('inside-vehicle'),
    grade: value('grade'), halfDays: value('half-days'), actualDaily: value('actual-daily'),
    actualMeal: value('actual-meal'), excludedMeals: value('excluded-meals'), longStay: value('long-stay'),
    eligibleDays: value('eligible-days'), confirmedDaily: value('confirmed-daily'),
    mileage: !byId('mileage').disabled && byId('mileage').checked,
    mileageDays: value('mileage-days'), mileageSavings: value('mileage-savings'),
    fares: Array.from(fareList.children, (entry) => ({
      kind: field(entry, 'kind').value, amount: field(entry, 'amount').value,
    })),
    lodgings: Array.from(lodgingList.children, (entry) => ({
      region: field(entry, 'region').value, nights: field(entry, 'nights').value,
      amount: field(entry, 'amount').value, extra: !field(entry, 'extra').disabled && field(entry, 'extra').checked,
    })),
  };
}

function element(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}

function unit() {
  return element('span', '원');
}

function showResult(result, input) {
  byId('total').replaceChildren(`${format.format(result.total)} `, unit());
  byId('result-context').textContent = result.context;
  const dates = byId('result-dates');
  dates.textContent = `출장 기간 ${input.startDate} ~ ${input.endDate}`;
  dates.hidden = false;
  const breakdown = byId('breakdown');
  breakdown.replaceChildren(...result.items.map(([label, amount]) => {
    const row = document.createElement('div');
    row.append(element('dt', label), element('dd', `${format.format(amount)}원`));
    return row;
  }));
  breakdown.hidden = false;
  const notes = byId('result-notes');
  notes.replaceChildren(...result.notes.map((note) => element('li', note)));
  notes.hidden = !result.notes.length;
  currentResult = { result, startDate: input.startDate, endDate: input.endDate };
  byId('print-result').disabled = false;
  byId('save-excel').disabled = false;
}

byId('print-result').addEventListener('click', () => window.print());
byId('show-help').addEventListener('click', () => byId('usage-help').showModal());
byId('save-excel').addEventListener('click', () => {
  if (currentResult) TravelExcel.download(currentResult);
});
byId('add-fare').addEventListener('click', () => addEntry('fare-template', fareList));
byId('add-lodging').addEventListener('click', () => addEntry('lodging-template', lodgingList));
form.addEventListener('input', (event) => {
  clearFeedback();
  if (event.target.matches('#half-days, #long-stay')) syncForm();
});
form.addEventListener('change', (event) => {
  if (event.target.matches('#trip-type, #grade, #mileage, [data-field="kind"]')) syncForm();
});
form.addEventListener('invalid', (event) => {
  const details = event.target.closest('details');
  if (details) details.open = true;
}, true);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearFeedback();
  try {
    const input = readInput();
    showResult(TravelCalculator.calculate(input), input);
  } catch (error) {
    byId('form-errors').textContent = error.message;
    byId('form-errors').hidden = false;
  }
});
form.addEventListener('reset', () => {
  fareList.replaceChildren();
  lodgingList.replaceChildren();
  byId('adjustments').open = false;
  clearFeedback();
  showPlaceholder('출장 정보를 입력한 뒤 여비 계산을 눌러 주세요.');
  window.setTimeout(syncForm, 0);
});
syncForm();
