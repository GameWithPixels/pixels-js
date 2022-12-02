export default function (date1?: Date, date2?: Date) {
  if (date1 && date2) {
    const time1 = date1.getTime();
    const time2 = date2.getTime();
    // Firmware dates read from DFU zip files have a precision of a minute
    return Math.floor(time1 / 60000) === Math.floor(time2 / 60000);
  } else {
    return false;
  }
}
