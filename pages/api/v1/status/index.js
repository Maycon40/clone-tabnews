function status(request, response) {
  response.status(200).json({ maycon: "maycon é bonito" });
}

export default status;
