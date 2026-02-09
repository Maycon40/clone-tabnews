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
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;
