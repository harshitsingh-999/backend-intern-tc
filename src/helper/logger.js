// src/helper/logger.js


import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

//Custom timestamp for dd-mm-yyyy hh:mm:ss
const customTimestamp = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

// console.log("date check-->",new Date(customTimestamp))

// Define the logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({format: customTimestamp}),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      level: 'error',
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
    }),
  ],
});

// Export the logger instance
export default logger;
