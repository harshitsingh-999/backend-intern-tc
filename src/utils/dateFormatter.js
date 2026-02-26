import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatDateTime(date) {
  if (!date) return "-";

  return dayjs(date).format("DD/MM/YYYY hh:mm A"); 
  // ❌ DO NOT tz() if Sequelize already uses +05:30
}
