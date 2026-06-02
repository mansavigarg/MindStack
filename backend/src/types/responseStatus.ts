export enum ResponseStatus {
    Success = 200,
    Created = 201,

    ValidationError = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    Conflict = 409,

    InternalError = 500,
    ServiceUnavailable = 503
}