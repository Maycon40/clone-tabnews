function can(userObject, requiredFeature, resource) {
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

function filterOutput(userObject, feature, output) {
  if (feature === "read:user") {
    return {
      id: output.id,
      username: output.username,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  } else if (feature === "read:user:self" && userObject.id === output.id) {
    return {
      id: output.id,
      username: output.username,
      email: output.email,
      features: output.features,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  } else if (feature === "read:session" && userObject.id === output.user_id) {
    return {
      id: output.id,
      token: output.token,
      user_id: output.user_id,
      expires_at: output.expires_at,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  } else if (feature === "read:activation_token") {
    return {
      id: output.id,
      user_id: output.user_id,
      used_at: output.used_at,
      expires_at: output.expires_at,
      created_at: output.created_at,
      updated_at: output.updated_at,
    };
  } else if (feature === "read:migration") {
    return output.map((migration) => {
      return {
        name: migration.name,
        path: migration.path,
        timestamp: migration.timestamp,
      };
    });
  } else if (feature === "read:status") {
    const result = {
      updated_at: output.updated_at,
      dependencies: {
        database: {
          max_connections: output.dependencies.database.max_connections,
          used_connections: output.dependencies.database.used_connections,
        },
      },
    };

    if (can(userObject, "read:status:all")) {
      result.dependencies.database.version =
        output.dependencies.database.version;
    }

    return result;
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
