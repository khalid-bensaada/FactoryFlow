// create a class and extend from error
Class AppError extends Error {
    // class attributs from class Error
    constructor(message, statusCode){
        // storage errors in message
        super (message);
        // make object for status of code
        this.statusCode = statusCode ;
        // create a object status for check the requiste HTTP is start with number 4 or more that's means error
        this.status = `${statusCode}`.startsWith('4') ?'fail' : 'error';
        // know what the type of error
        this.isOperational = true;
        // told us what is the place of error
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;