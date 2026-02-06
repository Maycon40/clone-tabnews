import * as cookie from "cookie";

import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import session from "models/session";
import user from "models/user";

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.log(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function injectAnonymousOrUser(request, response, next) {
  const sessionToken = request.cookies?.session_id;

  if (sessionToken) {
    await injectAuthenticatedUser(request);
  } else {
    await injectAnonymousUser(request);
  }

  next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies?.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  const userFound = await user.findOneById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userFound,
  };
}

async function injectAnonymousUser(request) {
  request.context = {
    ...request.context,
    user: {
      features: ["read:activation_token", "create:session", "create:user"],
    },
  };
}

function canRequest(requiredFeature) {
  return canRequestMiddleware;

  function canRequestMiddleware(request, response, next) {
    if (!request.context?.user?.features.includes(requiredFeature)) {
      throw new ForbiddenError({
        message: "Você não tem permissão para realizar esta ação.",
        action:
          "Verifique se o seu usuário possui a permissão necessária para realizar esta ação.",
      });
    }

    next();
  }
}

function setSessionCookie(response, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  canRequest,
  injectAnonymousOrUser,
  setSessionCookie,
  clearSessionCookie,
};

export default controller;
