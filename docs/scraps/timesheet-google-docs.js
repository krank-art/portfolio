function fillTimestamps() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const startRow = 2; // Starting row number
  const startColumn = 1; // Starting column number
  const numRows = 24; // Number of timestamps to fill

  for (var i = 0; i < numRows; i++) {
    const timestamp = `${i}:00`;
    sheet.getRange(startRow + i, startColumn).setValue(timestamp);
  }
}

function fillWeekdayAndDate() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const startColumn = 1;
  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const currentWeek = getDatesForCurrentWeek();
  for (let i = 0; i < 7; i++) {
    const currentDate = currentWeek[i];
    const weekdayIndex = currentDate.getDay();
    const weekdayLocalized = weekdays[weekdayIndex];
    const formattedDate = Utilities.formatDate(currentDate, 'GMT+1', 'dd.MM.yyyy');
    const value = weekdayLocalized + ', ' + formattedDate;
    sheet.getRange(startColumn, i + startColumn).setValue(value);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function getMondayOfWeek(date = new Date()) {
  const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
  const dayOfWeekSundayAdjusted = dayOfWeek + (dayOfWeek === 0 ? -6 : dayOfWeek);
  const difference = date.getDate() - dayOfWeekSundayAdjusted;
  const mondayDate = new Date();
  mondayDate.setDate(difference);
  return mondayDate;
}

function getDatesForCurrentWeek(date = new Date()) {
  const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startDate = new Date(date); // Clone today's date
  startDate.setDate(date.getDate() - currentDay); // Set to Monday of the current week

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    dates.push(currentDate); // You can adjust the date format as needed
  }

  return dates;
}
