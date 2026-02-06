function can(userObject, requiredFeature) {
  let authorized = false;

  if (userObject.features.includes(requiredFeature)) {
    authorized = true;
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;
