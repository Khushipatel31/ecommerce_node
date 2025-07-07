import morgan from "morgan";
import chalk from "chalk";
import fs from "fs";
import path from "path";
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFileStream = fs.createWriteStream(path.join(logDir, "access.log"), {
  flags: "a",
});

const customMorganFormat = (tokens, req, res) => {
  const status = res.statusCode;
  const statusColor =
    status >= 500
      ? chalk.red
      : status >= 400
      ? chalk.yellow
      : status >= 300
      ? chalk.cyan
      : status >= 200
      ? chalk.green
      : chalk.white;

  const log = [
    `[${new Date().toISOString()}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    status,
    `${tokens["response-time"](req, res)} ms`,
  ].join(" ");

  logFileStream.write(log + "\n");

  return [
    chalk.gray(`[${new Date().toISOString()}]`),
    chalk.magenta(tokens.method(req, res)),
    chalk.blue(tokens.url(req, res)),
    statusColor(status),
    chalk.white(`${tokens["response-time"](req, res)} ms`),
  ].join(" ");
};
export default morgan(customMorganFormat);
