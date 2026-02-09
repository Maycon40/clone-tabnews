function can(userObject, requiredFeature, resource) {
  let authorized = false;

  if (userObject.features.includes(requiredFeature)) {
    authorized = true;
  }

  if (requiredFeature === "update:user" && resource) {
    authorized = false;

    if (userObject.id === resource.id) {
      authorized = true;
    }
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
