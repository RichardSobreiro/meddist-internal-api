import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the status code and message
    let status: number;
    let message: string | object;

    if (exception instanceof HttpException) {
      // Use the status and message provided by HttpException
      status = exception.getStatus();
      message = exception.getResponse();
    } else {
      // Wrap all other errors in InternalServerErrorException
      const internalError = new InternalServerErrorException();
      status = internalError.getStatus();
      message = internalError.getResponse();
      console.error('Unhandled Exception:', exception); // Log the full exception
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
