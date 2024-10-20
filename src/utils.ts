import chalk from "chalk";

export function error(message: string) {
	return console.log(chalk.red(message));
}
export function info(message: string) {
	return console.log(chalk.blue(message));
}
export function success(message: string) {
	return console.log(chalk.green(message));
}
export function warn(message: string) {
	return console.log(chalk.yellow(message));
}
