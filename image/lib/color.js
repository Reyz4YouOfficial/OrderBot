const chalk = require('chalk')

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

const bgColor = (text, color) => {
	return !color ? chalk.bgGreen(text) : chalk.bgKeyword(color)(text)
}

module.exports = {
	color,
	bgColor
}
