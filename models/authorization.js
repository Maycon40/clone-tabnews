import { InternalServerError } from "infra/errors";

const availableFeatures = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",

  // SESSION
  "create:session",
  "read:session",

  // ACTIVATE TOKEN
  "read:activation_token",

  // MIGRATION
  "create:migration",
  "read:migration",

  // STATUS
  "read:status",
  "read:status:all",
];

function can(userObject, requiredFeature, resource) {
  validateUser(userObject);
  validateFeature(requiredFeature);

  let authorized = false;

  if (userObject.features.includes(requiredFeature)) {
    authorized = true;
  }

  if (requiredFeature === "update:user" && resource) {
    authorized = false;

    if (
      userObject.id === resource.id ||
      can(userObject, "update:user:others")
    ) {
      authorized = true;
    }
  }

  return authorized;
}

function filterOutput(userObject, feature, resouce) {
  validateUser(userObject);
  validateFeature(feature);
  validateResource(resouce);

  if (feature === "read:user") {
    return {
      id: resouce.id,
      username: resouce.username,
      features: resouce.features,
      created_at: resouce.created_at,
      updated_at: resouce.updated_at,
    };
  } else if (feature === "read:user:self" && userObject.id === resouce.id) {
    return {
      id: resouce.id,
      username: resouce.username,
      email: resouce.email,
      features: resouce.features,
      created_at: resouce.created_at,
      updated_at: resouce.updated_at,
    };
  } else if (feature === "read:session" && userObject.id === resouce.user_id) {
    return {
      id: resouce.id,
      token: resouce.token,
      user_id: resouce.user_id,
      expires_at: resouce.expires_at,
      created_at: resouce.created_at,
      updated_at: resouce.updated_at,
    };
  } else if (feature === "read:activation_token") {
    return {
      id: resouce.id,
      user_id: resouce.user_id,
      used_at: resouce.used_at,
      expires_at: resouce.expires_at,
      created_at: resouce.created_at,
      updated_at: resouce.updated_at,
    };
  } else if (feature === "read:migration") {
    return resouce.map((migration) => {
      return {
        name: migration.name,
        path: migration.path,
        timestamp: migration.timestamp,
      };
    });
  } else if (feature === "read:status") {
    const result = {
      updated_at: resouce.updated_at,
      dependencies: {
        database: {
          max_connections: resouce.dependencies.database.max_connections,
          used_connections: resouce.dependencies.database.used_connections,
        },
      },
    };

    if (can(userObject, "read:status:all")) {
      result.dependencies.database.version =
        resouce.dependencies.database.version;
    }

    return result;
  }
}

function validateUser(userObject) {
  if (!userObject || !userObject.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer um user no model authorization.",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !availableFeatures.includes(feature)) {
    throw new InternalServerError({
      cause:
        "É necessário fornecer uma feature conhecida no model authorization.",
    });
  }
}

function validateResource(resource) {
  if (!resource) {
    throw new InternalServerError({
      cause: "É necessário fornecer um resource no model authorization.",
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
